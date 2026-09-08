import { describe, expect, it, vi } from 'vitest'
import { isFetchError } from '../src'
import { createTestClient, jsonResponse } from './helpers'

describe('tanstack-fetch config (simple path)', () => {
  it('attaches Bearer token from getToken', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: true } }))
    const http = createTestClient(fetchImpl, {
      getToken: async () => 'secret-token',
    })

    await http.get('/secure')
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('authorization')).toBe('Bearer secret-token')
  })

  it('runs onUnauthorized for 401', async () => {
    const onUnauthorized = vi.fn()
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } }))
    const http = createTestClient(fetchImpl, { onUnauthorized })

    await expect(http.get('/secure')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 401,
    )
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(onUnauthorized.mock.calls[0]?.[0].status).toBe(401)
  })

  it('runs onForbidden for 403', async () => {
    const onForbidden = vi.fn()
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 403, body: { code: 'FORBIDDEN' } }))
    const http = createTestClient(fetchImpl, { onForbidden })

    await expect(http.get('/admin')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 403,
    )
    expect(onForbidden).toHaveBeenCalledTimes(1)
  })

  it('runs onNotFound for 404', async () => {
    const onNotFound = vi.fn()
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 404, body: { code: 'NOT_FOUND' } }))
    const http = createTestClient(fetchImpl, { onNotFound })

    await expect(http.get('/missing')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 404,
    )
    expect(onNotFound).toHaveBeenCalledTimes(1)
  })

  it('runs onServerError for 5xx', async () => {
    const onServerError = vi.fn()
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 503, body: { message: 'down' } }))
    const http = createTestClient(fetchImpl, {
      onServerError,
      plugins: [],
      maxRetries: 0,
    })

    await expect(http.get('/health')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 503,
    )
    expect(onServerError).toHaveBeenCalledTimes(1)
    expect(onServerError.mock.calls[0]?.[0].status).toBe(503)
  })

  it('supports advanced onStatus map and auth config', async () => {
    const on418 = vi.fn()
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 418, body: { code: 'TEAPOT' } }))
    const http = createTestClient(fetchImpl, {
      auth: {
        getToken: () => 'raw',
        scheme: '',
        header: 'x-api-key',
      },
      onStatus: {
        418: on418,
      },
    })

    await expect(http.get('/tea')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 418,
    )
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('x-api-key')).toBe('raw')
    expect(on418).toHaveBeenCalledTimes(1)
  })
})
