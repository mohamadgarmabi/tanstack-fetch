import { describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src'
import { createFetch as createSseFetch } from '../src/sse'
import { createTRPCFetch } from '../src/trpc'
import {
  createDevtools,
  createDevtoolsStore,
  estimateSize,
  parsePathParams,
  parseQuery,
} from '../src/devtools'

describe('devtools helpers', () => {
  it('estimates JSON and string sizes', () => {
    expect(estimateSize('abc')).toBe(3)
    expect(estimateSize({ a: 1 })).toBeGreaterThan(0)
  })

  it('parses query and path-ish params', () => {
    const url = new URL('https://api.test/users/42?page=1&q=hi')
    expect(parseQuery(url)).toEqual({ page: '1', q: 'hi' })
    expect(parsePathParams('/users/42')).toMatchObject({ usersId: '42' })
  })
})

describe('devtools store', () => {
  it('upserts, patches, filters, and respects pause/flags', () => {
    const store = createDevtoolsStore({ maxEntries: 2, http: true, sse: false })
    const listener = vi.fn()
    const unsub = store.subscribe(listener)

    store.upsert({
      id: 'a:0',
      kind: 'http',
      status: 'pending',
      method: 'GET',
      url: 'https://x/a',
      path: '/a',
      params: {},
      query: {},
      requestHeaders: {},
      responseHeaders: {},
      requestBytes: 0,
      responseBytes: 0,
      attempt: 0,
      maxRetries: 0,
      startedAt: Date.now(),
      callStack: [],
    })
    expect(store.list('http')).toHaveLength(1)

    store.upsert({
      id: 'b:0',
      kind: 'sse',
      status: 'pending',
      method: 'GET',
      url: 'https://x/s',
      path: '/s',
      params: {},
      query: {},
      requestHeaders: {},
      responseHeaders: {},
      requestBytes: 0,
      responseBytes: 0,
      attempt: 0,
      maxRetries: 0,
      startedAt: Date.now(),
      callStack: [],
    })
    expect(store.list('sse')).toHaveLength(0)

    store.setPaused(true)
    store.patch('a:0', { status: 'success' })
    expect(store.getById('a:0')?.status).toBe('pending')

    store.setPaused(false)
    store.patch('a:0', { status: 'success', timingMs: 12 })
    expect(store.getById('a:0')?.timingMs).toBe(12)

    store.select('a:0')
    expect(store.getSnapshot().selectedId).toBe('a:0')
    store.clear()
    expect(store.list()).toHaveLength(0)
    expect(listener).toHaveBeenCalled()
    unsub()
  })
})

describe('devtools interceptor', () => {
  it('records http success and error with timing', async () => {
    const { store, interceptor } = createDevtools({ http: true })

    const mockFetch: typeof fetch = async (input) => {
      const url = String(input)
      await new Promise((r) => setTimeout(r, 5))
      if (url.includes('/missing')) {
        return new Response(JSON.stringify({ message: 'nope' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    const api = createFetch({
      baseUrl: 'https://demo.test',
      fetch: mockFetch,
      plugins: ['trace'],
      interceptors: [interceptor],
      maxRetries: 0,
    })

    await api.get('/users/:id', { params: { id: '7' }, query: { page: 1 } })
    const ok = store.list('http')[0]
    expect(ok?.status).toBe('success')
    expect(ok?.path).toContain('/users/7')
    expect(ok?.query.page).toBe('1')
    expect(ok?.timingMs).toBeGreaterThanOrEqual(0)
    expect(ok?.httpStatus).toBe(200)

    await expect(api.get('/missing')).rejects.toBeTruthy()
    const err = store.list('http').find((e) => e.path.includes('missing'))
    expect(err?.status).toBe('error')
    expect(err?.httpStatus).toBe(404)
  })

  it('records ssr kind when source is ssr', async () => {
    const { store, interceptor } = createDevtools({ ssr: true, http: true })
    const api = createFetch({
      baseUrl: 'https://demo.test',
      source: 'ssr',
      fetch: async () =>
        new Response(JSON.stringify({ me: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      plugins: ['trace', 'ssr-forward'],
      interceptors: [interceptor],
      incoming: { cookie: 'a=1', requestId: 'r1' },
      maxRetries: 0,
    })

    await api.get('/me')
    const entry = store.list('ssr')[0]
    expect(entry?.kind).toBe('ssr')
    expect(entry?.incoming?.hasCookie).toBe(true)
  })

  it('records sse open and events', async () => {
    const { store, interceptor } = createDevtools({ sse: true })
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        controller.enqueue(encoder.encode('data: {"n":1}\n\n'))
        controller.close()
      },
    })

    const api = createSseFetch({
      baseUrl: 'https://demo.test',
      fetch: async () =>
        new Response(stream, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
      plugins: ['trace'],
      interceptors: [interceptor],
      maxRetries: 0,
    })

    await new Promise<void>((resolve, reject) => {
      api.sse<{ n: number }>('/events', {
        onMessage: () => undefined,
        onClose: () => resolve(),
        onError: (error) => reject(error),
      })
    })

    const entry = store.list('sse')[0]
    expect(entry?.kind).toBe('sse')
    expect(entry?.sse?.eventCount).toBeGreaterThanOrEqual(1)
    expect(entry?.sse?.events?.length).toBeGreaterThanOrEqual(1)
    expect(entry?.sse?.events?.[0]?.data).toEqual({ n: 1 })
    expect(entry?.status).toBe('success')
    expect(entry?.sse?.open).toBe(false)
  })

  it('setupDevtools registers interceptor in one call', async () => {
    const { setupDevtools } = await import('../src/devtools')
    const mockFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    const api = createFetch({
      baseUrl: 'https://demo.test',
      fetch: mockFetch,
      plugins: ['trace'],
      maxRetries: 0,
    })
    const { store, destroy } = setupDevtools(api, { mount: false })
    await api.get('/ping')
    expect(store.list('http')).toHaveLength(1)
    expect(store.list('http')[0]?.callStack).toBeDefined()
    destroy()
  })

  it('records trpc success via onResponse', async () => {
    const { store, interceptor } = createDevtools({ trpc: true })
    const trpcFetch = createTRPCFetch({
      baseUrl: 'https://demo.test',
      fetch: async () =>
        new Response(JSON.stringify([{ result: { data: 1 } }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      plugins: ['trace'],
      interceptors: [interceptor],
      maxRetries: 0,
    })

    const response = await trpcFetch('https://demo.test/api/trpc/hello')
    expect(response.ok).toBe(true)
    const entry = store.list('trpc')[0]
    expect(entry?.kind).toBe('trpc')
    expect(entry?.status).toBe('success')
    expect(entry?.httpStatus).toBe(200)
  })
})
