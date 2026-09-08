import { describe, expect, it, vi } from 'vitest'
import { createTestClient, jsonResponse } from './helpers'

describe('ssrfetch request', () => {
  it('returns a typed ok result', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ body: { id: '1', name: 'Ada' } }))
    const http = createTestClient(fetchImpl)

    const result = await http.get<{ id: string; name: string }>('/users/:id', {
      params: { id: '1' },
      query: { include: 'posts' },
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe('Ada')
    }
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      'https://api.example.com/users/1?include=posts',
    )
  })

  it('returns a typed error result without throwing', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ status: 404, body: { code: 'NOT_FOUND', message: 'missing' } }),
      )
    const http = createTestClient(fetchImpl)
    const result = await http.get('/users/missing')

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

  it('throws when throwOnError is enabled', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ status: 500, body: { message: 'boom' } }))
    const http = createTestClient(fetchImpl, { throwOnError: true })

    await expect(http.get('/fail')).rejects.toThrow('boom')
  })
})
