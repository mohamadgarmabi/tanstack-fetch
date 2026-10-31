import { describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src'
import { createAuthInterceptor, createStatusInterceptor } from '../src/plugins-entry'
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
})
