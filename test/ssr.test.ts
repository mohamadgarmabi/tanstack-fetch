import { describe, expect, it, vi } from 'vitest'
import { createTestClient, jsonResponse } from './helpers'

describe('tanstack-fetch ssr', () => {
  it('forwards incoming cookies on the server', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { me: true } }))
    const http = createTestClient(fetchImpl, {
      source: 'ssr',
      plugins: ['ssr-forward', 'trace'],
      incoming: {
        cookie: 'session=abc',
        requestId: 'req-1',
      },
    })

    await http.get('/me')
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('cookie')).toBe('session=abc')
    expect(headers.get('x-request-id')).toBe('req-1')
  })

  it('does not forward cookies in the browser', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: {} }))
    const http = createTestClient(fetchImpl, {
      source: 'browser',
      plugins: ['ssr-forward'],
      incoming: { cookie: 'session=abc' },
    })

    await http.get('/me')
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('cookie')).toBeNull()
  })

  it('rejects relative baseUrl on SSR', async () => {
    const http = createTestClient(vi.fn(), { source: 'ssr', baseUrl: '/api' })
    await expect(http.get('/users')).rejects.toThrow('absolute baseUrl')
  })
})
