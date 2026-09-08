import { describe, expect, it, vi } from 'vitest'
import { createTestClient } from './helpers'

const sseStream = (chunks: string[]) => {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

describe('typed-ssr-http sse', () => {
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
    const http = createTestClient(fetchImpl, { plugins: ['sse-resume'] })
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

  it('sets last-event-id through the sse-resume interceptor on reconnect context', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(sseStream(['id: 42\nevent: tick\ndata: {"n":1}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    )
    const http = createTestClient(fetchImpl, { plugins: ['sse-resume'] })
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
})
