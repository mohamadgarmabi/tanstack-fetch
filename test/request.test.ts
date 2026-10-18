import { describe, expect, it, vi } from 'vitest'
import { isAbortError, isFetchError } from '../src'
import { createTestClient, jsonResponse } from './helpers'

describe('tanstack-fetch request', () => {
  it('returns typed data by default (TanStack Query style)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { id: '1', name: 'Ada' } }))
    const http = createTestClient(fetchImpl)

    const data = await http.get<{ id: string; name: string }, { id: string }>('/users/:id', {
      params: { id: '1' },
      query: { include: 'posts' },
    })

    expect(data.name).toBe('Ada')
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      'https://api.example.com/users/1?include=posts',
    )
  })

  it('throws FetchError on HTTP failure by default', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ status: 404, body: { code: 'NOT_FOUND', message: 'missing' } }),
      )
    const http = createTestClient(fetchImpl)

    await expect(http.get('/users/missing')).rejects.toSatisfy(
      (error: unknown) => isFetchError(error) && error.status === 404 && error.code === 'NOT_FOUND',
    )
  })

  it('posts json and sets content-type', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ status: 201, body: { ok: true } }))
    const http = createTestClient(fetchImpl)
    await http.post('/users', { body: { name: 'Ada' } })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ name: 'Ada' }))
    expect(new Headers(init.headers).get('content-type')).toBe('application/json')
  })

  it('exposes status and body on FetchError', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 500, body: { message: 'boom' } }))
    const http = createTestClient(fetchImpl)

    try {
      await http.get('/fail')
      expect.unreachable()
    } catch (error) {
      expect(isFetchError(error)).toBe(true)
      if (isFetchError(error)) {
        expect(error.message).toBe('boom')
        expect(error.status).toBe(500)
      }
    }
  })

  it('reports timeouts as abort errors, not network errors', async () => {
    const fetchImpl = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
        }),
    )
    const http = createTestClient(fetchImpl as typeof fetch, { timeoutMs: 5 })

    await expect(http.get('/slow')).rejects.toSatisfy(
      (error: unknown) => isAbortError(error) && (error as Error).name === 'TimeoutError',
    )
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('clears the timeout timer once the request finishes', async () => {
    vi.useFakeTimers()
    try {
      const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: true } }))
      const http = createTestClient(fetchImpl)

      await http.get('/fast')

      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('sends typed-array bodies as raw bytes', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { ok: true } }))
    const http = createTestClient(fetchImpl)
    const bytes = new Uint8Array([1, 2, 3])

    await http.post('/bytes', { body: bytes })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit
    expect(init.body).toBe(bytes)
    expect(new Headers(init.headers).has('content-type')).toBe(false)
  })
})
