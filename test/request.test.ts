import { describe, expect, it, vi } from 'vitest'
import { isFetchError } from '../src'
import { createTestClient, jsonResponse } from './helpers'

describe('tanstack-fetch request', () => {
  it('returns typed data by default (TanStack Query style)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { id: '1', name: 'Ada' } }))
    const http = createTestClient(fetchImpl)

    const data = await http.get<{ id: string; name: string }>('/users/:id', {
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

  it('returns FetchResult when throwOnError is false', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ status: 404, body: { code: 'NOT_FOUND', message: 'missing' } }),
      )
    const http = createTestClient(fetchImpl, { throwOnError: false })
    const result = await http.get('/users/missing', { throwOnError: false })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(404)
      expect(result.error.code).toBe('NOT_FOUND')
    }
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
})
