/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { get } from 'svelte/store'
import { createFetch } from '../src/index'
import { clearFetchClient, setFetchClient, useFetch, useSse } from '../src/svelte'
import { createSseTestClient } from './helpers'

const sseStream = (chunks: string[]) => {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

describe('tanstack-fetch/svelte', () => {
  it('setFetchClient makes useFetch work', () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    clearFetchClient()
    setFetchClient({ client: api })
    expect(useFetch()).toBe(api)
    clearFetchClient()
  })

  it('useFetch throws without setFetchClient', () => {
    clearFetchClient()
    expect(() => useFetch()).toThrow(/setFetchClient/)
  })

  it('useSse receives messages with { client }', async () => {
    clearFetchClient()
    const fetchImpl = async () =>
      new Response(sseStream(['data: {"id":"2"}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    const api = createSseTestClient(fetchImpl)

    const { data, close } = useSse<{ id: string }>('/orders/stream', {
      client: api,
    })

    await vi.waitFor(() => {
      expect(get(data)).toEqual({ id: '2' })
    })

    close()
  })
})
