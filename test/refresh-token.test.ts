import { describe, expect, it, vi } from 'vitest'
import { isFetchError } from '../src'
import { createRefreshTokenInterceptor } from '../src/plugins/refresh-token'
import { createTestClient, jsonResponse } from './helpers'

describe('createRefreshTokenInterceptor', () => {
  it('refreshes on the first 401 then retries once', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(jsonResponse({ body: { ok: true } }))
    let token = 'old'
    const refresh = vi.fn(async () => {
      token = 'refreshed'
    })
    const http = createTestClient(fetchImpl, { getToken: () => token })
    http.use('refresh-token', createRefreshTokenInterceptor({ refresh }))

    const data = await http.get<{ ok: boolean }>('/secure')
    expect(data.ok).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    const secondHeaders = new Headers((fetchImpl.mock.calls[1]?.[1] as RequestInit).headers)
    expect(secondHeaders.get('authorization')).toBe('Bearer refreshed')
  })

  it('does not refresh again after the first attempt', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() => jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } }))
    const refresh = vi.fn(async () => {
      /* token still invalid */
    })
    const onUnauthorized = vi.fn()
    const http = createTestClient(fetchImpl, {
      getToken: () => 'stale',
      onUnauthorized,
    })
    http.use('refresh-token', createRefreshTokenInterceptor({ refresh }))

    await expect(http.get('/secure')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 401,
    )
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('shares one in-flight refresh across parallel 401s', async () => {
    let resolveRefresh!: () => void
    const refreshGate = new Promise<void>((resolve) => {
      resolveRefresh = resolve
    })
    let token = 'old'
    const refresh = vi.fn(async () => {
      await refreshGate
      token = 'refreshed'
    })

    const fetchImpl = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('authorization')
      if (authorization === 'Bearer refreshed') {
        return jsonResponse({ body: { ok: true } })
      }
      return jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } })
    })

    const http = createTestClient(fetchImpl, { getToken: () => token })
    http.use('refresh-token', createRefreshTokenInterceptor({ refresh }))

    const first = http.get<{ ok: boolean }>('/a')
    const second = http.get<{ ok: boolean }>('/b')
    await vi.waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1)
    })
    resolveRefresh()
    await expect(first).resolves.toEqual({ ok: true })
    await expect(second).resolves.toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refreshes before the request when the token is near expiry', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: true } }))
    let token = 'old'
    let expiresAt = Date.now() - 1_000
    const refresh = vi.fn(async () => {
      token = 'refreshed'
      expiresAt = Date.now() + 60 * 60 * 1000
    })
    const http = createTestClient(fetchImpl, { getToken: () => token })
    http.use(
      'refresh-token',
      createRefreshTokenInterceptor({
        refresh,
        before: { getExpiresAt: () => expiresAt, skewMs: 60_000 },
        after: false,
      }),
    )

    const data = await http.get<{ ok: boolean }>('/secure')
    expect(data.ok).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('authorization')).toBe('Bearer refreshed')
  })

  it('skips before-refresh when the token is still fresh', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: true } }))
    const refresh = vi.fn(async () => {
      /* unused */
    })
    const http = createTestClient(fetchImpl, { getToken: () => 'fresh' })
    http.use(
      'refresh-token',
      createRefreshTokenInterceptor({
        refresh,
        before: { getExpiresAt: () => Date.now() + 60 * 60 * 1000, skewMs: 60_000 },
      }),
    )

    await http.get('/secure')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('calls onRefreshFailed when refresh throws on 401', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementation(() => jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } }))
    const onRefreshFailed = vi.fn()
    const http = createTestClient(fetchImpl, { getToken: () => 'stale' })
    http.use(
      'refresh-token',
      createRefreshTokenInterceptor({
        refresh: async () => {
          throw new Error('refresh failed')
        },
        onRefreshFailed,
      }),
    )

    await expect(http.get('/secure')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 401,
    )
    expect(onRefreshFailed).toHaveBeenCalledTimes(1)
  })

  it('can refresh through the same client when refresh-token is ejected', async () => {
    const fetchImpl = vi.fn().mockImplementation((url: string | URL, init?: RequestInit) => {
      const path = String(url)
      if (path.endsWith('/auth/refresh')) {
        return jsonResponse({ body: { accessToken: 'refreshed', expiresIn: 3600 } })
      }
      const authorization = new Headers(init?.headers).get('authorization')
      if (authorization === 'Bearer refreshed') {
        return jsonResponse({ body: { ok: true } })
      }
      return jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } })
    })

    let token = 'old'
    const http = createTestClient(fetchImpl, {
      credentials: 'include',
      getToken: () => token,
    })
    http.use(
      'refresh-token',
      createRefreshTokenInterceptor({
        refresh: async () => {
          const body = await http.post<{ accessToken: string; expiresIn: number }>(
            '/auth/refresh',
            { interceptors: { eject: ['refresh-token', 'auth'] } },
          )
          token = body.accessToken
        },
      }),
    )

    const data = await http.get<{ ok: boolean }>('/secure')
    expect(data.ok).toBe(true)
    expect(fetchImpl.mock.calls.some(([url]) => String(url).endsWith('/auth/refresh'))).toBe(true)
  })
})
