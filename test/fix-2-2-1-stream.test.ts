import { describe, expect, it, vi } from 'vitest'
import { createFetch as createLiveFetch } from '../src/live'
import type { CreateWebSocket } from '../src'
import { consumeSseBuffer } from '../src/sse-parse'
import { createSseTestClient } from './helpers'

const encoder = new TextEncoder()
const sseResponse = (chunks: string[], fail?: Error) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start: (controller) => chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk))),
      // Fail / end only after the queued chunks were read (error() would drop them).
      pull: (controller) => (fail ? controller.error(fail) : controller.close()),
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  )

const headerOf = (fetchImpl: ReturnType<typeof vi.fn>, call: number, name: string) =>
  new Headers((fetchImpl.mock.calls[call]?.[1] as RequestInit).headers).get(name)

const collect = async (iterable: AsyncIterable<{ data: unknown }>) => {
  const out: unknown[] = []
  for await (const event of iterable) out.push(event.data)
  return out
}

const retryOnError = { onSseError: () => ({ action: 'retry' as const, delayMs: 1 }) }

describe('2.2.1 sse reconnect (bugs 1-3)', () => {
  it('reconnects after a mid-stream drop with Last-Event-ID and reconnect headers', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(sseResponse(['id: 7\ndata: 1\n\n'], new TypeError('dropped')))
      .mockResolvedValueOnce(sseResponse(['id: 8\ndata: 2\n\n']))
    const http = createSseTestClient(fetchImpl, { plugins: ['sse-resume'] })
    const onSseError = vi.fn(retryOnError.onSseError)
    const onSseClose = vi.fn(() => ({ action: 'continue' as const }))
    http.use('retry', {
      order: 10, // before sse-resume's own 1s retry, to keep the test fast
      onSseError,
      onSseClose,
      onSseReconnect: (context) => {
        context.request.headers.set('x-resume', 'yes')
        return { action: 'continue', context }
      },
    })

    expect(await collect(http.sse('/events'))).toEqual([1, 2])
    expect(onSseError).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(headerOf(fetchImpl, 1, 'last-event-id')).toBe('7')
    expect(headerOf(fetchImpl, 1, 'x-resume')).toBe('yes')
    expect(onSseClose).toHaveBeenCalledTimes(1)
  })

  it('routes a fetch rejection through onSseError and retries', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(sseResponse(['data: ok\n\n']))
    const http = createSseTestClient(fetchImpl)
    const codes: Array<string | undefined> = []
    http.use('retry', {
      onSseError: (context) => {
        codes.push(context.error?.code)
        return { action: 'retry', delayMs: 1 }
      },
    })

    expect(await collect(http.sse('/events'))).toEqual(['ok'])
    expect(codes).toEqual(['NETWORK_ERROR'])
  })

  it('still throws the original error when onSseError does not retry, and runs onSseClose', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(sseResponse(['data: 1\n\n'], new TypeError('boom')))
    const http = createSseTestClient(fetchImpl)
    const onSseError = vi.fn(() => ({ action: 'continue' as const }))
    const onSseClose = vi.fn(() => ({ action: 'continue' as const }))
    http.use('watch', { onSseError, onSseClose })

    await expect(collect(http.sse('/events'))).rejects.toThrow('boom')
    expect(onSseError).toHaveBeenCalledTimes(1)
    expect(onSseClose).toHaveBeenCalledTimes(1)
  })

  it('does not reconnect when aborted during the retry delay', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('down', { status: 503 }))
    const http = createSseTestClient(fetchImpl)
    http.use('retry', { onSseError: () => ({ action: 'retry', delayMs: 50 }) })
    const onClose = vi.fn()
    const onError = vi.fn()
    const subscription = http.sse('/events', { onMessage: () => undefined, onClose, onError })
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1))
    subscription.close()
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
  })

  it('runs onSseClose once when the subscription is closed mid-stream', async () => {
    let push: ((chunk: string) => void) | undefined
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => {
      const body = new ReadableStream<Uint8Array>({
        start: (controller) => {
          push = (chunk) => controller.enqueue(encoder.encode(chunk))
          // Like real fetch: aborting errors the body.
          init.signal?.addEventListener('abort', () =>
            controller.error(new DOMException('aborted', 'AbortError')),
          )
        },
      })
      return Promise.resolve(new Response(body, { status: 200 }))
    })
    const http = createSseTestClient(fetchImpl as unknown as typeof fetch)
    const onSseClose = vi.fn(() => ({ action: 'continue' as const }))
    http.use('watch', { onSseClose })
    const onClose = vi.fn()
    const subscription = http.sse('/events', {
      onMessage: () => subscription.close(),
      onClose,
    })
    await vi.waitFor(() => expect(push).toBeDefined())
    push?.('data: 1\n\n')
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSseClose).toHaveBeenCalledTimes(1)
  })
})

describe('2.2.1 sse request (bug 4)', () => {
  it('sends the body (as POST) and keeps GET without one', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() => Promise.resolve(sseResponse(['data: 1\n\n'])))
    const http = createSseTestClient(fetchImpl)
    await collect(http.sse('/events', { body: { q: 1 } }))
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"q":1}')
    expect(headerOf(fetchImpl, 0, 'content-type')).toBe('application/json')

    await collect(http.sse('/events'))
    expect((fetchImpl.mock.calls[1]?.[1] as RequestInit).method).toBe('GET')
  })

  it('uses a method set by onRequest', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(sseResponse(['data: 1\n\n']))
    const http = createSseTestClient(fetchImpl)
    http.use('method', {
      onRequest: (context) => {
        context.request.method = 'PUT'
        return { action: 'continue', context }
      },
    })
    await collect(http.sse('/events', { body: 'x' }))
    expect((fetchImpl.mock.calls[0]?.[1] as RequestInit).method).toBe('PUT')
  })
})

describe('2.2.1 sse parser (bugs 5-7)', () => {
  const parseChunks = (chunks: string[]) => {
    let buffer = ''
    const blocks = []
    for (const chunk of chunks) {
      const parsed = consumeSseBuffer(buffer + chunk)
      buffer = parsed.rest
      blocks.push(...parsed.blocks)
    }
    return blocks
  }

  it('joins a \\r\\n split across chunks', () => {
    const events = parseChunks(['data: a\r', '\ndata: b\r\n\r\n']).map((block) => block.event?.data)
    expect(events).toEqual(['a\nb'])
  })

  it('keeps the id of an id-only block and sends it on reconnect', async () => {
    expect(parseChunks(['id: 5\n\n'])).toEqual([{ id: '5' }])
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(sseResponse(['data: 1\n\nid: 9\n\n'], new TypeError('drop')))
      .mockResolvedValueOnce(sseResponse([]))
    const http = createSseTestClient(fetchImpl)
    http.use('retry', retryOnError)
    await collect(http.sse('/events'))
    expect(headerOf(fetchImpl, 1, 'last-event-id')).toBe('9')
  })

  it('follows the spec for bare fields, trailing spaces and event-only blocks', () => {
    const [bare, spaced, eventOnly, retryOnly] = parseChunks([
      'data\ndata: x\n\n',
      'data: a  \n\n',
      'event: tick\n\n',
      'retry: 10\n\n',
    ])
    expect(bare?.event?.data).toBe('\nx')
    expect(spaced?.event?.data).toBe('a  ')
    expect(eventOnly?.event).toBeUndefined()
    expect(retryOnly?.event).toBeUndefined()
  })
})

describe('2.2.1 sse listen (bug 8)', () => {
  it('stops delivering buffered events after close()', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(sseResponse(['data: 1\n\ndata: 2\n\ndata: 3\n\n']))
    const http = createSseTestClient(fetchImpl)
    const messages: unknown[] = []
    await new Promise<void>((resolve) => {
      const subscription = http.sse('/events', {
        onMessage: (data) => {
          messages.push(data)
          subscription.close()
        },
        onClose: () => resolve(),
      })
    })
    expect(messages).toEqual([1])
  })
})

describe('2.2.1 ws (bugs 9-10)', () => {
  const setup = () => {
    const sockets: Array<{
      onopen: ((event: Event) => void) | null
      onclose: ((event: CloseEvent) => void) | null
      readyState: number
    }> = []
    const createWebSocket: CreateWebSocket = () => {
      const socket = {
        readyState: 0,
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
        send: () => undefined,
        close: () => undefined,
      }
      sockets.push(socket)
      return socket as unknown as WebSocket
    }
    const api = createLiveFetch({ baseUrl: 'https://api.example.com', createWebSocket })
    return { api, sockets }
  }
  const openThenDrop = (socket?: ReturnType<typeof setup>['sockets'][number]) => {
    if (!socket) return
    socket.readyState = 1
    socket.onopen?.(new Event('open'))
    socket.readyState = 3
    socket.onclose?.({ code: 1006 } as CloseEvent)
  }

  it('counts accept-then-drop connections against the retry budget', async () => {
    const { api, sockets } = setup()
    const onClose = vi.fn()
    api.ws('/live', { onClose, reconnect: { retries: 2, delayMs: 1 } })
    for (let index = 0; index < 3; index += 1) {
      await vi.waitFor(() => expect(sockets.length).toBe(index + 1))
      openThenDrop(sockets[index])
    }
    expect(onClose).toHaveBeenCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(sockets).toHaveLength(3)
  })

  it('resets the retry budget once a socket stayed open', async () => {
    vi.useFakeTimers()
    try {
      const { api, sockets } = setup()
      const onClose = vi.fn()
      api.ws('/live', { onClose, reconnect: { retries: 1, delayMs: 1 } })
      await vi.waitFor(() => expect(sockets).toHaveLength(1))
      openThenDrop(sockets[0])
      await vi.advanceTimersByTimeAsync(5)
      expect(sockets).toHaveLength(2)
      const second = sockets[1]
      if (second) {
        second.readyState = 1
        second.onopen?.(new Event('open'))
      }
      await vi.advanceTimersByTimeAsync(5_000)
      second?.onclose?.({ code: 1006 } as CloseEvent)
      await vi.advanceTimersByTimeAsync(5)
      expect(sockets).toHaveLength(3)
      expect(onClose).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('calls onClose once for an already-aborted signal and never connects', async () => {
    const { api, sockets } = setup()
    const onClose = vi.fn()
    api.ws('/live', { onClose, signal: AbortSignal.abort() })
    await Promise.resolve()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(sockets).toHaveLength(0)
  })
})

describe('2.2.1 sse-resume reconnects on its own', () => {
  it('retries a dropped stream with Last-Event-ID and no extra interceptor', async () => {
    vi.useFakeTimers()
    try {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(sseResponse(['id: 7\ndata: 1\n\n'], new TypeError('dropped')))
        .mockResolvedValueOnce(sseResponse(['id: 8\ndata: 2\n\n']))
      const http = createSseTestClient(fetchImpl, { plugins: ['sse-resume'] })
      const done = collect(http.sse('/events'))
      await vi.runAllTimersAsync()
      expect(await done).toEqual([1, 2])
      expect(headerOf(fetchImpl, 1, 'last-event-id')).toBe('7')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not retry a 401', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('no', { status: 401 }))
    const http = createSseTestClient(fetchImpl, { plugins: ['sse-resume'] })
    await expect(collect(http.sse('/events'))).rejects.toBeDefined()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
