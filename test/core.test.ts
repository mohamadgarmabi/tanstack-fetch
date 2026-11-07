import { describe, expect, it, vi } from 'vitest'
import { createFetch, isAbortError, type HttpInterceptor } from '../src'
import { createAuthInterceptor, createStatusInterceptor } from '../src/plugins-entry'
import { createRefreshTokenInterceptor } from '../src/plugins/refresh-token'
import { combineSignals } from '../src/utils/signals'
import { jsonResponse } from './helpers'

describe('tanstack-fetch core (slim)', () => {
  it('has no upload() and adds auth / status through interceptors', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ body: { ok: true } }))
      .mockResolvedValueOnce(jsonResponse({ status: 401, body: { message: 'expired' } }))
    const onUnauthorized = vi.fn()
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      interceptors: [
        createAuthInterceptor({ getToken: () => 'abc' }),
        createStatusInterceptor({ 401: onUnauthorized }),
      ],
    })

    expect('upload' in api).toBe(false)
    await api.get('/me')
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer abc')
    await expect(api.get('/me')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  const retryOn = (status: number, delayMs?: number): HttpInterceptor => ({
    name: 'retry-test',
    onResponseError: (context) =>
      context.error?.status === status
        ? { action: 'retry', delayMs }
        : { action: 'continue', context },
  })

  it('aborts immediately while waiting for a retry delay', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ status: 503 }))
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl,
      interceptors: [retryOn(503, 5_000)],
    })
    const controller = new AbortController()
    const pending = api.get('/a', { signal: controller.signal })
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1))
    const started = Date.now()
    controller.abort()
    await expect(pending).rejects.toSatisfy(isAbortError)
    expect(Date.now() - started).toBeLessThan(1_000)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('returns the last error once the retry budget is spent', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ status: 503 }))
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl,
      maxRetries: 2,
      interceptors: [retryOn(503)],
    })
    await expect(api.get('/a')).rejects.toMatchObject({ status: 503 })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('times out even when the caller passes its own signal', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
        ),
    )
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl as typeof fetch,
      timeoutMs: 20,
    })
    await expect(api.get('/a', { signal: new AbortController().signal })).rejects.toSatisfy(
      (error: unknown) => (error as Error).name === 'TimeoutError',
    )
  })

  it('does not retry a ReadableStream body', async () => {
    const fetchImpl = vi.fn().mockImplementation(() => jsonResponse({ status: 503 }))
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl,
      interceptors: [retryOn(503)],
    })
    const body = new ReadableStream({ start: (c) => c.close() })
    await expect(api.post('/a', { body })).rejects.toMatchObject({ status: 503 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('a late 401 after another refresh retries without refreshing again', async () => {
    let token = 'old'
    const refresh = vi.fn(async () => {
      token = `new${refresh.mock.calls.length}`
    })
    let releaseA!: () => void
    const aGate = new Promise<void>((resolve) => (releaseA = resolve))
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('authorization')
      if (String(url).endsWith('/a') && auth === 'Bearer old') await aGate
      return auth === 'Bearer old'
        ? jsonResponse({ status: 401 })
        : jsonResponse({ body: { auth } })
    })
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl as typeof fetch,
      interceptors: [
        createAuthInterceptor({ getToken: () => token }),
        createRefreshTokenInterceptor({ refresh }),
      ],
    })
    const a = api.get('/a')
    await expect(api.get('/b')).resolves.toEqual({ auth: 'Bearer new1' })
    releaseA()
    await expect(a).resolves.toEqual({ auth: 'Bearer new1' })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes on 401 even after an earlier retry for another reason', async () => {
    let token = 'old'
    const refresh = vi.fn(async () => {
      token = 'new'
    })
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 502 }))
      .mockResolvedValueOnce(jsonResponse({ status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ body: { ok: true } }))
    const api = createFetch({
      baseUrl: 'https://x.test',
      fetch: fetchImpl,
      interceptors: [
        createAuthInterceptor({ getToken: () => token }),
        createRefreshTokenInterceptor({ refresh }),
        retryOn(502),
      ],
    })
    await expect(api.get('/a')).resolves.toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('combines signals without AbortSignal.any (Node 18)', () => {
    vi.stubGlobal('AbortSignal', Object.assign(Object.create(AbortSignal), { any: undefined }))
    try {
      const a = new AbortController()
      const combined = combineSignals([a.signal, new AbortController().signal])
      a.abort('stop')
      expect(combined?.aborted).toBe(true)
      expect(combined?.reason).toBe('stop')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
