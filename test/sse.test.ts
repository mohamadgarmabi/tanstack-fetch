import { describe, expect, it, vi } from 'vitest'
import { isFetchError } from '../src'
import { createSseTestClient } from './helpers'

const sseStream = (chunks: string[]) => {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

describe('tanstack-fetch sse', () => {
  it('parses events and drops heartbeats with sse-resume', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(
          sseStream([
            'event: ping\ndata: {}\n\n',
            'id: 1\nevent: order.updated\ndata: {"id":7,"status":"paid"}\n\n',
          ]),
          { status: 200, headers: { 'content-type': 'text/event-stream' } },
        ),
      )
    const http = createSseTestClient(fetchImpl, { plugins: ['sse-resume'] })
    const events = []
    for await (const event of http.sse<{ id: number; status: string }>('/events')) {
      events.push(event)
    }

    expect(events).toHaveLength(1)
    expect(events[0]?.event).toBe('order.updated')
    expect(events[0]?.data.id).toBe(7)
    expect(new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers).get('accept')).toBe(
      'text/event-stream',
    )
  })

  it('supports simple onMessage callback API', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(sseStream(['event: tick\ndata: {"n":1}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    )
    const http = createSseTestClient(fetchImpl, { plugins: ['sse-resume'] })
    const messages: Array<{ n: number }> = []

    await new Promise<void>((resolve, reject) => {
      const subscription = http.sse<{ n: number }>('/events', {
        onMessage: (data) => messages.push(data),
        onClose: () => resolve(),
        onError: reject,
      })
      expect(typeof subscription.close).toBe('function')
    })

    expect(messages).toEqual([{ n: 1 }])
  })

  it('sets last-event-id through the sse-resume interceptor on reconnect context', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(sseStream(['id: 42\nevent: tick\ndata: {"n":1}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    )
    const http = createSseTestClient(fetchImpl, { plugins: ['sse-resume'] })
    const seen: string[] = []
    http.use('capture-id', {
      onSseEvent: (context) => {
        seen.push(context.event.id ?? '')
        return { action: 'continue', context }
      },
    })

    for await (const event of http.sse('/events')) {
      expect(event.id).toBe('42')
    }
    expect(seen).toEqual(['42'])
  })

  it('throws when onRequest short-circuits with an error', async () => {
    const fetchImpl = vi.fn()
    const http = createSseTestClient(fetchImpl)
    http.use('block', {
      onRequest: () => ({
        action: 'short-circuit',
        result: {
          ok: false,
          status: 403,
          error: { status: 403, code: 'FORBIDDEN', message: 'blocked', body: null },
          headers: new Headers(),
        },
      }),
    })

    await expect(async () => {
      for await (const event of http.sse('/events')) {
        void event
      }
    }).rejects.toSatisfy((error: unknown) => isFetchError(error) && error.status === 403)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('retries onRequest retry actions until the stream opens', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(sseStream(['event: tick\ndata: {"n":1}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    )
    const http = createSseTestClient(fetchImpl, { maxRetries: 1 })
    let attempts = 0
    http.use('retry-open', {
      onRequest: () => {
        attempts += 1
        if (attempts === 1) {
          return { action: 'retry', delayMs: 1 }
        }
        return { action: 'continue' }
      },
    })

    const events = []
    for await (const event of http.sse<{ n: number }>('/events')) {
      events.push(event)
    }
    expect(attempts).toBe(2)
    expect(events).toHaveLength(1)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
