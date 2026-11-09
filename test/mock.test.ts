import { describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src/live'
import { createFetch as createCoreFetch } from '../src'
import { createMocks } from '../src/mock'
import type { MockOptions } from '../src/mock'

const setup = (mocks: MockOptions) => {
  const realFetch = vi.fn(async () => Response.json({ real: true }))
  const api = createFetch({
    baseUrl: 'https://api.example.com/v1',
    fetch: realFetch as unknown as typeof fetch,
    getToken: () => 'abc',
    timeoutMs: 2_000,
    mocks: createMocks(mocks),
  })
  return { api, realFetch }
}

describe('tanstack-fetch mocks', () => {
  it('mocks HTTP routes with params, query, body and auth headers', async () => {
    const handler = vi.fn(({ params, query, body, headers }) => ({
      id: params.id,
      q: query.get('q'),
      body,
      auth: headers.get('authorization'),
    }))
    const { api, realFetch } = setup({
      routes: [{ method: 'POST', path: '/users/:id', handler }],
    })
    const data = await api.post('/users/:id', {
      params: { id: 7 },
      query: { q: 'x' },
      body: { name: 'a' },
    })
    expect(data).toEqual({ id: '7', q: 'x', body: { name: 'a' }, auth: 'Bearer abc' })
    expect(realFetch).not.toHaveBeenCalled()
  })

  it('returns a Response as-is so errors flow through as FetchError', async () => {
    const { api } = setup({
      routes: [
        { path: '/missing', handler: () => new Response('{"message":"nope"}', { status: 404 }) },
      ],
    })
    await expect(api.get('/missing')).rejects.toMatchObject({ status: 404 })
  })

  it('passes through unmatched, disabled routes and a disabled mocks block', async () => {
    const route = { path: '/a', handler: () => ({ mock: true }) }
    const { api, realFetch } = setup({ routes: [route, { path: '/b', handler: () => 1 }] })
    expect(await api.get('/a')).toEqual({ mock: true })
    expect(await api.get('/c')).toEqual({ real: true })
    Object.assign(route, { enabled: false })
    expect(await api.get('/a')).toEqual({ real: true })
    expect(realFetch).toHaveBeenCalledTimes(2)

    const off = setup({ enabled: false, routes: [{ path: '/b', handler: () => 1 }] })
    expect(await off.api.get('/b')).toEqual({ real: true })
  })

  it('streams SSE from an async generator and stops it on close', async () => {
    let finished = false
    const { api } = setup({
      routes: [
        { path: '/ticks', handler: () => ({ list: true }) },
        {
          path: '/ticks',
          sse: true,
          // eslint-disable-next-line no-restricted-syntax -- generators need function syntax
          handler: async function* () {
            try {
              for (let i = 1; ; i += 1) yield { price: i }
            } finally {
              finished = true
            }
          },
        },
      ],
    })
    const received: unknown[] = []
    for await (const event of api.sse('/ticks')) {
      received.push(event.data)
      if (received.length === 3) break
    }
    expect(received).toEqual([{ price: 1 }, { price: 2 }, { price: 3 }])
    await vi.waitFor(() => expect(finished).toBe(true))
    // The non-SSE route on the same path still answers plain GETs.
    expect(await api.get('/ticks')).toEqual({ list: true })
  })

  it('streams NDJSON for api.stream()', async () => {
    const { api } = setup({
      routes: [
        {
          method: 'POST',
          path: '/chat',
          // eslint-disable-next-line no-restricted-syntax -- generators need function syntax
          handler: async function* () {
            yield { token: 'hi' }
            yield { token: 'there' }
          },
        },
      ],
    })
    const tokens: unknown[] = []
    for await (const line of api.stream('/chat', { body: { q: 1 } })) tokens.push(line)
    expect(tokens).toEqual([{ token: 'hi' }, { token: 'there' }])
  })

  it('mocks WebSocket routes: echo, server push, cleanup', async () => {
    const cleanup = vi.fn()
    const { api } = setup({
      routes: [
        {
          ws: true,
          path: '/rooms/:id',
          handler: (connection, request) => {
            connection.send({ joined: request.params.id })
            connection.onMessage((data) => connection.send({ echo: data }))
            return cleanup
          },
        },
      ],
    })
    const messages: unknown[] = []
    const socket = api.ws('/rooms/:id', {
      params: { id: 3 },
      onMessage: (data) => messages.push(data),
    })
    socket.send({ text: 'hello' }) // queued until open
    await vi.waitFor(() => expect(messages).toHaveLength(2))
    expect(messages).toEqual([{ joined: '3' }, { echo: { text: 'hello' } }])
    socket.close()
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('works on the slim core entry', async () => {
    const api = createCoreFetch({
      baseUrl: 'https://api.example.com',
      mocks: createMocks({ routes: [{ path: '/ping', handler: () => ({ pong: true }) }] }),
    })
    expect(await api.get('/ping')).toEqual({ pong: true })
  })
})
