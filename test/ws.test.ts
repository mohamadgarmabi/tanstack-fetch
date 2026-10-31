import { describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src/live'
import type { CreateWebSocket, NoParams } from '../src'

const fakeSocket = (
  url: string,
  init: { protocols?: string[]; headers: Record<string, string> },
) => {
  const socket = {
    url,
    init,
    readyState: 0,
    sent: [] as unknown[],
    onopen: null as ((event: Event) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onclose: null as ((event: CloseEvent) => void) | null,
    send: (data: unknown) => socket.sent.push(data),
    close: (code = 1000) => socket.serverClose(code),
    open: () => {
      socket.readyState = 1
      socket.onopen?.(new Event('open'))
    },
    message: (data: unknown) => socket.onmessage?.({ data } as MessageEvent),
    serverClose: (code: number) => {
      socket.readyState = 3
      socket.onclose?.({ code } as CloseEvent)
    },
  }
  return socket
}
type FakeSocket = ReturnType<typeof fakeSocket>

const setup = (extra?: Parameters<typeof createFetch>[0]) => {
  const sockets: FakeSocket[] = []
  const createWebSocket: CreateWebSocket = (url, init) => {
    const socket = fakeSocket(url, init)
    sockets.push(socket)
    return socket as unknown as WebSocket
  }
  const api = createFetch({
    baseUrl: 'https://api.example.com',
    getToken: () => 'abc',
    createWebSocket,
    ...extra,
  })
  const next = () => vi.waitFor(() => expect(sockets.length).toBeGreaterThan(0)).then(() => sockets)
  return { api, sockets, next }
}

describe('tanstack-fetch ws', () => {
  it('sends auth as a header outside the browser and maps https → wss', async () => {
    const { api, next } = setup({ headers: { 'x-app': '1' } })
    api.ws('/rooms/:id', { params: { id: 7 }, query: { lang: 'fa' } })
    const [socket] = await next()
    expect(socket?.url).toBe('wss://api.example.com/rooms/7?lang=fa')
    expect(socket?.init.headers).toMatchObject({ authorization: 'Bearer abc', 'x-app': '1' })
  })

  it('puts the token in the query or subprotocol when headers are unavailable', async () => {
    const query = setup()
    query.api.ws('/live', { authIn: 'query' })
    const [q] = await query.next()
    expect(q?.url).toBe('wss://api.example.com/live?token=abc')
    expect(q?.init.headers).toEqual({})

    const protocol = setup()
    protocol.api.ws('/live', { authIn: 'protocol', protocols: 'v1' })
    const [p] = await protocol.next()
    expect(p?.init.protocols).toEqual(['v1', 'abc'])
  })

  it('queues sends until open, parses JSON frames, and reconnects after an abnormal close', async () => {
    const { api, sockets, next } = setup()
    const messages: unknown[] = []
    const onReconnect = vi.fn()
    const onClose = vi.fn()
    const socket = api.ws<{ n: number }, NoParams, { hi: string }>('/live', {
      onMessage: (data) => messages.push(data),
      onReconnect,
      onClose,
      reconnect: { retries: 1, delayMs: 1 },
    })
    socket.send({ hi: 'there' })
    const [first] = await next()
    expect(first?.sent).toEqual([])
    first?.open()
    expect(first?.sent).toEqual(['{"hi":"there"}'])
    first?.message('{"n":1}')
    first?.message('plain')
    expect(messages).toEqual([{ n: 1 }, 'plain'])

    first?.serverClose(1006)
    expect(onReconnect).toHaveBeenCalledWith(1)
    await vi.waitFor(() => expect(sockets).toHaveLength(2))
    expect(onClose).not.toHaveBeenCalled()

    socket.close()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stops after reconnects are exhausted', async () => {
    const { api, next } = setup()
    const onClose = vi.fn()
    api.ws('/live', { onClose, reconnect: false })
    const [socket] = await next()
    socket?.serverClose(1006)
    expect(onClose).toHaveBeenCalledWith({ code: 1006 })
  })
})

describe('tanstack-fetch stream (NDJSON)', () => {
  it('yields one parsed item per line across chunk boundaries', async () => {
    const encoder = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start: (controller) => {
        ;['{"a":1}\n{"a"', ':2}\n\n', 'tail'].forEach((c) => controller.enqueue(encoder.encode(c)))
        controller.close()
      },
    })
    const fetchImpl = vi.fn().mockResolvedValue(new Response(body, { status: 200 }))
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      getToken: () => 'abc',
    })
    const items: unknown[] = []
    for await (const item of api.stream('/chat', { body: { q: 'hi' } })) items.push(item)

    expect(items).toEqual([{ a: 1 }, { a: 2 }, 'tail'])
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"q":"hi"}')
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer abc')
    expect(new Headers(init.headers).get('accept')).toBe('application/x-ndjson')
  })

  it('throws a FetchError on non-2xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('nope', { status: 401 }))
    const api = createFetch({ baseUrl: 'https://api.example.com', fetch: fetchImpl })
    await expect(async () => {
      for await (const _ of api.stream('/chat')) void _
    }).rejects.toMatchObject({ status: 401 })
  })
})

describe('tanstack-fetch ws — lifecycle edge cases', () => {
  it('detaches the old socket on close(): no stale error / message / close callbacks', async () => {
    const { api, next } = setup()
    const onError = vi.fn()
    const onMessage = vi.fn()
    const onClose = vi.fn()
    const socket = api.ws('/live', { onError, onMessage, onClose })
    const [raw] = await next()
    socket.close()
    raw?.onerror?.(new Event('error'))
    raw?.message('late')
    raw?.serverClose(1006)
    expect(onError).not.toHaveBeenCalled()
    expect(onMessage).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
    socket.send('ignored')
    expect(raw?.sent).toEqual([])
  })

  it('keeps reconnecting when getToken fails during a reconnect', async () => {
    let calls = 0
    const { api, sockets, next } = setup({
      getToken: () => {
        calls += 1
        if (calls === 2) throw new Error('refresh down')
        return 'abc'
      },
    })
    const onError = vi.fn()
    api.ws('/live', { onError, reconnect: { retries: 3, delayMs: 1 } })
    const [first] = await next()
    first?.serverClose(1006)
    await vi.waitFor(() => expect(sockets).toHaveLength(2))
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'refresh down' }))
  })

  it('accepts absolute ws(s) URLs', async () => {
    const { api, next } = setup()
    api.ws('wss://realtime.example.com/socket')
    const [socket] = await next()
    expect(socket?.url).toBe('wss://realtime.example.com/socket')
  })

  it('refuses to leak a token in the browser unless authIn is set', async () => {
    vi.stubGlobal('document', {})
    try {
      const { api, sockets } = setup()
      const onError = vi.fn()
      const onClose = vi.fn()
      api.ws('/live', { onError, onClose })
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(sockets).toHaveLength(0)
      expect(String(onError.mock.calls[0]?.[0])).toContain('authIn')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('tanstack-fetch stream — interceptors', () => {
  it('runs onUnauthorized and retries via onResponseError', async () => {
    const ok = new Response('{"a":1}\n', { status: 200 })
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"message":"expired"}', { status: 401 }))
      .mockResolvedValueOnce(ok)
    const onUnauthorized = vi.fn(() => ({ action: 'retry' as const, delayMs: 0 }))
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      onUnauthorized,
    })
    const items: unknown[] = []
    for await (const item of api.stream('/chat')) items.push(item)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(items).toEqual([{ a: 1 }])
  })

  it('sends duplex: half for a ReadableStream body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"a":1}\n', { status: 200 }))
    const api = createFetch({ baseUrl: 'https://api.example.com', fetch: fetchImpl })
    const body = new ReadableStream({ start: (controller) => controller.close() })
    for await (const _ of api.stream('/chat', { body, method: 'POST' })) void _
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ duplex: 'half' })
  })

  it('runs onRequestError on a network failure and retries', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('{"a":1}\n', { status: 200 }))
    const onRequestError = vi.fn(() => ({ action: 'retry' as const, delayMs: 0 }))
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      interceptors: [{ name: 'net', onRequestError }],
    })
    const items: unknown[] = []
    for await (const item of api.stream('/chat')) items.push(item)
    expect(onRequestError).toHaveBeenCalledTimes(1)
    expect(items).toEqual([{ a: 1 }])
  })

  it('stops waiting for a retry delay when aborted', async () => {
    const controller = new AbortController()
    const fetchImpl = vi.fn().mockResolvedValue(new Response('nope', { status: 503 }))
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      interceptors: [
        { name: 'slow', onResponseError: () => ({ action: 'retry', delayMs: 60_000 }) },
      ],
    })
    const run = (async () => {
      for await (const _ of api.stream('/chat', { signal: controller.signal })) void _
    })()
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1))
    controller.abort()
    await expect(run).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('tanstack-fetch transport (WebTransport)', () => {
  const fakeTransport = () => {
    const sent: string[] = []
    let push: (bytes: Uint8Array) => void = () => undefined
    let resolveReady: () => void = () => undefined
    let resolveClosed: (info: WebTransportCloseInfo) => void = () => undefined
    let rejectClosed: (error: unknown) => void = () => undefined
    const transport = {
      ready: new Promise<void>((resolve) => (resolveReady = resolve)),
      closed: new Promise<WebTransportCloseInfo>((resolve, reject) => {
        resolveClosed = resolve
        rejectClosed = reject
      }),
      datagrams: {
        readable: new ReadableStream<Uint8Array>({ start: (c) => (push = (b) => c.enqueue(b)) }),
        writable: new WritableStream<Uint8Array>({
          write: (chunk) => void sent.push(new TextDecoder().decode(chunk)),
        }),
      },
      close: vi.fn((info: WebTransportCloseInfo) => resolveClosed(info)),
    }
    return {
      transport,
      sent,
      open: () => resolveReady(),
      receive: (text: string) => push(new TextEncoder().encode(text)),
      drop: () => rejectClosed(new Error('network')),
    }
  }

  it('sends / receives datagrams with query auth over https and reconnects after a drop', async () => {
    const sessions: Array<ReturnType<typeof fakeTransport> & { url: string }> = []
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      getToken: () => 'abc',
      createWebTransport: (url) => {
        const session = { ...fakeTransport(), url }
        sessions.push(session)
        return session.transport as unknown as WebTransport
      },
    })
    const messages: unknown[] = []
    const onReconnect = vi.fn()
    const onClose = vi.fn()
    const socket = api.transport<{ x: number }, NoParams, { y: number }>('/game', {
      authIn: 'query',
      onMessage: (data) => messages.push(data),
      onReconnect,
      onClose,
      reconnect: { retries: 1, delayMs: 1 },
    })
    socket.send({ y: 1 })
    await vi.waitFor(() => expect(sessions).toHaveLength(1))
    const first = sessions[0]!
    expect(first.url).toBe('https://api.example.com/game?token=abc')

    first.open()
    await vi.waitFor(() => expect(first.sent).toEqual(['{"y":1}']))
    first.receive('{"x":2}')
    await vi.waitFor(() => expect(messages).toEqual([{ x: 2 }]))

    first.drop()
    await vi.waitFor(() => expect(sessions).toHaveLength(2))
    expect(onReconnect).toHaveBeenCalledWith(1)

    socket.close()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('requires an explicit authIn for WebTransport when a token exists', async () => {
    const create = vi.fn()
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      getToken: () => 'abc',
      createWebTransport: create,
    })
    const onError = vi.fn()
    const onClose = vi.fn()
    api.transport('/game', { onError, onClose })
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(create).not.toHaveBeenCalled()
  })
})
