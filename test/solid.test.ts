/**
 * @vitest-environment happy-dom
 */
import { createRoot } from 'solid-js'
import { describe, expect, it } from 'vitest'
import { createFetch } from '../src/index'
import { FetchProvider, useFetch, useSse } from '../src/solid'
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

describe('tanstack-fetch/solid', () => {
  it('FetchProvider provides the client to useFetch', () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    let seen: ReturnType<typeof useFetch> | undefined

    const dispose = createRoot((disposeRoot) => {
      FetchProvider({
        client: api,
        get children() {
          seen = useFetch()
          return null
        },
      })
      return disposeRoot
    })

    expect(seen).toBe(api)
    dispose()
  })

  it('useFetch throws without a provider', () => {
    expect(() =>
      createRoot(() => {
        useFetch()
      }),
    ).toThrow(/FetchProvider/)
  })

  it('useSse receives messages with { client }', async () => {
    const fetchImpl = async () =>
      new Response(sseStream(['data: {"id":"1"}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    const api = createSseTestClient(fetchImpl)

    const result = await new Promise<{ id: string }>((resolve, reject) => {
      createRoot((dispose) => {
        useSse<{ id: string }>('/orders/stream', {
          client: api,
          onMessage: (data) => {
            resolve(data)
            dispose()
          },
          onError: (error) => {
            reject(error)
            dispose()
          },
        })
      })
    })

    expect(result).toEqual({ id: '1' })
  })
})
