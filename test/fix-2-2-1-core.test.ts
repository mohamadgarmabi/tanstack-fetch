import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFetch, parseRetryAfter, type HttpInterceptor } from '../src'
import { resolveCreateFetchOptions } from '../src/client-options'
import { combineSignals, releaseSignal } from '../src/utils/signals'
import { createTestClient, jsonResponse } from './helpers'

const sentHeaders = (fetchImpl: ReturnType<typeof vi.fn>, call = 0) =>
  new Headers((fetchImpl.mock.calls[call]?.[1] as RequestInit).headers)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('2.2.1 core fixes', () => {
  it('#1 resolves a relative baseUrl against the browser location', async () => {
    vi.stubGlobal('location', { href: 'https://app.example.com/page' })
    const fetchImpl = vi.fn(async (_url: unknown, _init?: RequestInit) =>
      jsonResponse({ body: [] }),
    )
    await createFetch({ baseUrl: '/api', fetch: fetchImpl }).get('/users')
    await createFetch({ fetch: fetchImpl }).get('/users')
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('https://app.example.com/api/users')
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe('https://app.example.com/users')
  })

  it('#1 gives a clear error without a location or absolute baseUrl', async () => {
    const api = createFetch({ fetch: vi.fn() })
    await expect(api.get('/users')).rejects.toThrow(/tanstack-fetch: .*absolute baseUrl/)
  })

  it('#2 shares the client options registry across bundled copies', () => {
    const api = createFetch({ baseUrl: 'https://x.test' })
    const registry = (globalThis as Record<symbol, WeakMap<object, unknown>>)[
      Symbol.for('tanstack-fetch.clientOptions')
    ]
    expect(registry?.get(api)).toBe(resolveCreateFetchOptions(api))
  })

  it('#3 interceptor errors after a response are not retried as network errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ status: 401 }))
    const onRequestError = vi.fn(() => ({ action: 'retry' as const }))
    const boom: HttpInterceptor = {
      name: 'boom',
      onResponseError: () => {
        throw new Error('redirect to login')
      },
      onRequestError,
    }
    const api = createFetch({ baseUrl: 'https://x.test', fetch: fetchImpl, interceptors: [boom] })
    await expect(api.post('/orders', { body: { a: 1 } })).rejects.toThrow('redirect to login')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(onRequestError).not.toHaveBeenCalled()
  })

  it('#4 abort with a custom reason is not a retried network error', async () => {
    const controller = new AbortController()
    const reason = new Error('user left')
    const fetchImpl = vi.fn((_url: unknown, init: RequestInit) => {
      controller.abort(reason)
      return Promise.reject(init.signal?.reason)
    })
    const onRequestError = vi.fn(() => ({ action: 'retry' as const }))
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl as unknown as typeof fetch,
      interceptors: [{ name: 'r', onRequestError }],
    })
    await expect(api.get('/a', { signal: controller.signal })).rejects.toBe(reason)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(onRequestError).not.toHaveBeenCalled()
  })

  it('#5 FormData drops an inherited content-type so fetch sets the boundary', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: {} }))
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl,
      headers: { 'content-type': 'application/json' },
    })
    const form = new FormData()
    form.append('a', '1')
    await api.post('/upload', { body: form })
    expect(sentHeaders(fetchImpl).has('content-type')).toBe(false)
  })

  it('#6 drop in onRequest rejects without sending', async () => {
    const fetchImpl = vi.fn()
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl,
      interceptors: [{ name: 'd', onRequest: () => ({ action: 'drop' }) }],
    })
    await expect(api.get('/a')).rejects.toMatchObject({
      name: 'FetchError',
      code: 'REQUEST_DROPPED',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('#6 drop in onResponse keeps the response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: 1 } }))
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl,
      interceptors: [{ name: 'd', onResponse: () => ({ action: 'drop' }) }],
    })
    await expect(api.get('/a')).resolves.toEqual({ ok: 1 })
  })

  it('#7 onServerError still runs for 503 when onStatus[500] is set', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ status: 500 }))
    const on500 = vi.fn()
    const onServerError = vi.fn()
    const api = createTestClient(fetchImpl, {
      maxRetries: 0,
      onStatus: { 500: on500 },
      onServerError,
    })
    await expect(api.get('/a')).rejects.toMatchObject({ status: 503 })
    expect(onServerError).toHaveBeenCalledTimes(1)
    await expect(api.get('/a')).rejects.toMatchObject({ status: 500 })
    expect(on500).toHaveBeenCalledTimes(1)
    expect(onServerError).toHaveBeenCalledTimes(1)
  })

  it('#8 invalid Retry-After values use the fallback', () => {
    const header = (value: string) => new Headers({ 'retry-after': value })
    expect(parseRetryAfter(header('-5'), 1000)).toBe(1000)
    expect(parseRetryAfter(header('soon 5'), 1000)).toBe(1000)
    expect(parseRetryAfter(header('2'), 1000)).toBe(2000)
    expect(parseRetryAfter(header(new Date(0).toUTCString()), 1000)).toBe(0)
  })

  it('#9 fallback combineSignals releases its listeners', () => {
    vi.stubGlobal('AbortSignal', Object.assign(AbortSignal, { any: undefined }))
    const user = new AbortController()
    const remove = vi.spyOn(user.signal, 'removeEventListener')
    const combined = combineSignals([user.signal, new AbortController().signal])
    releaseSignal(combined)
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  })

  it('#9 requests release user-signal listeners on the fallback path', async () => {
    const any = AbortSignal.any
    ;(AbortSignal as { any?: unknown }).any = undefined
    try {
      const user = new AbortController()
      const add = vi.spyOn(user.signal, 'addEventListener')
      const remove = vi.spyOn(user.signal, 'removeEventListener')
      const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: {} }))
      const api = createFetch({ baseUrl: 'https://x.test', fetch: fetchImpl, timeoutMs: 5_000 })
      await api.get('/a', { signal: user.signal })
      expect(add).toHaveBeenCalledTimes(1)
      expect(remove).toHaveBeenCalledTimes(1)
    } finally {
      AbortSignal.any = any
    }
  })
})
