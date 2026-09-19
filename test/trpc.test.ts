import { describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src'
import { createTRPCFetch, createTRPCFetchLink } from '../src/trpc'
import { jsonResponse } from './helpers'

describe('tanstack-fetch/trpc', () => {
  it('createTRPCFetch attaches Bearer token from createFetch client', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ body: { result: { data: { ok: true } } } }))
    const api = createFetch({
      baseUrl: 'https://api.example.com',
      fetch: fetchImpl,
      getToken: async () => 'secret-token',
      timeoutMs: 5_000,
    })

    const trpcFetch = createTRPCFetch(api)
    const response = await trpcFetch('https://api.example.com/trpc/greeting', {
      method: 'GET',
      headers: { accept: 'application/json' },
    })

    expect(response.ok).toBe(true)
    const headers = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('authorization')).toBe('Bearer secret-token')
  })

  it('createTRPCFetch resolves relative tRPC URLs (Router / Start)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { result: { data: {} } } }))
    const trpcFetch = createTRPCFetch({
      fetch: fetchImpl,
      baseUrl: 'https://app.example.com',
      timeoutMs: 5_000,
      maxRetries: 0,
    })

    await trpcFetch('/api/trpc/posts.list', { method: 'GET' })

    const calledUrl = String(fetchImpl.mock.calls[0]?.[0])
    expect(calledUrl).toBe('https://app.example.com/api/trpc/posts.list')
  })

  it('createTRPCFetch runs onUnauthorized for HTTP 401', async () => {
    const onUnauthorized = vi.fn()
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 401, body: { error: { message: 'nope' } } }))
    const trpcFetch = createTRPCFetch({
      fetch: fetchImpl,
      onUnauthorized,
      timeoutMs: 5_000,
      maxRetries: 0,
    })

    const response = await trpcFetch('https://api.example.com/trpc/secure', { method: 'GET' })
    expect(response.status).toBe(401)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('createTRPCFetchLink returns a terminating link with custom fetch', () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: {} }))
    const link = createTRPCFetchLink({
      url: '/api/trpc',
      fetch: fetchImpl,
      getToken: () => 'abc',
      maxRetries: 0,
    })
    expect(typeof link).toBe('function')
  })
})
