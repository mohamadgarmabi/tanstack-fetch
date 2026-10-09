/**
 * @vitest-environment happy-dom
 */
import { DestroyRef, Injector, runInInjectionContext } from '@angular/core'
import { describe, expect, it } from 'vitest'
import { createFetch } from '../src/index'
import { FETCH_CLIENT, injectFetch, useSse } from '../src/angular'
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

const createInjector = (providers: { provide: unknown; useValue: unknown }[]) =>
  Injector.create({ providers: providers as never })

describe('tanstack-fetch/angular', () => {
  it('injectFetch reads FETCH_CLIENT', () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    const injector = createInjector([{ provide: FETCH_CLIENT, useValue: api }])
    const client = runInInjectionContext(injector, () => injectFetch())
    expect(client).toBe(api)
  })

  it('injectFetch throws without provider', () => {
    const injector = createInjector([])
    expect(() => runInInjectionContext(injector, () => injectFetch())).toThrow(
      /provideFetchClient/,
    )
  })

  it('useSse receives messages with { client }', async () => {
    const fetchImpl = async () =>
      new Response(sseStream(['data: {"id":"3"}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    const api = createSseTestClient(fetchImpl)
    const injector = createInjector([
      {
        provide: DestroyRef,
        useValue: { onDestroy: (_callback: () => void) => undefined },
      },
    ])

    const result = await new Promise<{ id: string }>((resolve, reject) => {
      runInInjectionContext(injector, () => {
        useSse<{ id: string }>('/orders/stream', {
          client: api,
          onMessage: (data) => resolve(data),
          onError: (error) => reject(error),
        })
      })
    })

    expect(result).toEqual({ id: '3' })
  })
})
