import { describe, expect, it, vi } from 'vitest'
import { createTestClient, jsonResponse } from './helpers'

describe('typed-ssr-http interceptors', () => {
  it('lets seniors add a named auth interceptor', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: true } }))
    const http = createTestClient(fetchImpl)

    http.use('auth', {
      order: 20,
      onRequest: (context) => {
        context.request.headers.set('authorization', 'Bearer secret')
        return { action: 'continue', context }
      },
    })

    await http.get('/secure')
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('authorization')).toBe('Bearer secret')
  })

  it('retries once on 401 and ejects by name', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } }))
      .mockResolvedValueOnce(jsonResponse({ body: { ok: true } }))
    const http = createTestClient(fetchImpl)

    let token = 'old'
    http.use('auth', {
      onRequest: (context) => {
        context.request.headers.set('authorization', `Bearer ${token}`)
        return { action: 'continue', context }
      },
      onResponseError: (context) => {
        if (context.error?.status === 401 && context.meta.attempt === 0) {
          token = 'refreshed'
          return { action: 'retry' }
        }
        return { action: 'continue', context }
      },
    })

    const result = await http.get('/secure')
    expect(result.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    const secondHeaders = new Headers((fetchImpl.mock.calls[1]?.[1] as RequestInit).headers)
    expect(secondHeaders.get('authorization')).toBe('Bearer refreshed')

    http.eject('auth')
    fetchImpl.mockResolvedValueOnce(jsonResponse({ status: 401, body: { code: 'UNAUTHORIZED' } }))
    const second = await http.get('/secure')
    expect(second.ok).toBe(false)
  })

  it('supports short-circuit for mocks', async () => {
    const fetchImpl = vi.fn()
    const http = createTestClient(fetchImpl)
    http.use('mock-users', {
      onRequest: () => ({
        action: 'short-circuit',
        result: { ok: true, status: 200, data: [{ id: '1' }], headers: new Headers() },
      }),
    })

    const result = await http.get('/users')
    expect(result.ok).toBe(true)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('can eject interceptors per request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: {} }))
    const http = createTestClient(fetchImpl)
    http.use('auth', {
      onRequest: (context) => {
        context.request.headers.set('authorization', 'Bearer secret')
        return { action: 'continue', context }
      },
    })

    await http.get('/public', { interceptors: { eject: ['auth'] } })
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('authorization')).toBeNull()
  })
})
