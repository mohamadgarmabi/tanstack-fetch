/**
 * @vitest-environment happy-dom
 */
import { createApp, defineComponent, h, nextTick, watch } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src/index'
import { createFetchPlugin, provideFetchClient, useFetch, useSse } from '../src/vue'
import { createSseTestClient } from './helpers'
import type { UseSseResult } from '../src/vue'

const sseStream = (chunks: string[]) => {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
}

const mountSetup = (setup: () => void) => {
  const Comp = defineComponent({
    setup: () => {
      setup()
      return () => h('div')
    },
  })
  const app = createApp(Comp)
  app.mount(document.createElement('div'))
  return app
}

describe('tanstack-fetch/vue', () => {
  it('createFetchPlugin provides the client to useFetch', () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    let seen: ReturnType<typeof useFetch> | undefined

    const Comp = defineComponent({
      setup: () => {
        seen = useFetch()
        return () => h('div')
      },
    })

    const el = document.createElement('div')
    const app = createApp(Comp)
    app.use(createFetchPlugin({ client: api }))
    app.mount(el)

    expect(seen).toBe(api)
    app.unmount()
  })

  it('provideFetchClient provides the client to child useFetch', () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    let seen: ReturnType<typeof useFetch> | undefined

    const Child = defineComponent({
      setup: () => {
        seen = useFetch()
        return () => h('div')
      },
    })

    const Parent = defineComponent({
      setup: () => {
        provideFetchClient(api)
        return () => h(Child)
      },
    })

    const app = createApp(Parent)
    app.mount(document.createElement('div'))

    expect(seen).toBe(api)
    app.unmount()
  })

  it('useFetch throws without a plugin', () => {
    const Comp = defineComponent({
      setup: () => {
        expect(() => useFetch()).toThrow(/createFetchPlugin/)
        return () => h('div')
      },
    })

    const app = createApp(Comp)
    app.mount(document.createElement('div'))
    app.unmount()
  })

  it('useSse works with { client } and no plugin', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(sseStream(['event: tick\ndata: {"n":1}\n\n']), {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    )
    const api = createSseTestClient(fetchImpl, { plugins: ['sse-resume'] })
    let result: UseSseResult<{ n: number }> | undefined
    const statuses: string[] = []

    const app = mountSetup(() => {
      result = useSse<{ n: number }>('/events', { client: api })
      watch(
        () => result!.status.value,
        (value) => statuses.push(value),
        { immediate: true },
      )
    })

    await vi.waitFor(() => {
      expect(result?.data.value).toEqual({ n: 1 })
    })
    expect(statuses).toContain('connecting')
    expect(statuses).toContain('connected')

    await vi.waitFor(() => {
      expect(result?.status.value).toBe('disconnected')
    })

    result?.close()
    expect(result?.status.value).toBe('disconnected')
    app.unmount()
  })

  it('useSse stays disconnected when enabled is false', async () => {
    const fetchImpl = vi.fn()
    const api = createSseTestClient(fetchImpl)
    let result: UseSseResult<unknown> | undefined

    const app = mountSetup(() => {
      result = useSse('/events', { client: api, enabled: false })
    })

    await nextTick()
    expect(result?.status.value).toBe('disconnected')
    expect(fetchImpl).not.toHaveBeenCalled()
    app.unmount()
  })

  it('useSse errors without an SSE client', async () => {
    let result: UseSseResult<unknown> | undefined

    const app = mountSetup(() => {
      result = useSse('/events')
    })

    await nextTick()
    expect(result?.status.value).toBe('error')
    expect(result?.error.value?.message).toMatch(/tanstack-fetch\/sse/)
    app.unmount()
  })

  it('useSse errors when client has no sse()', async () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    let result: UseSseResult<unknown> | undefined

    const app = mountSetup(() => {
      result = useSse('/events', { client: api as never })
    })

    await nextTick()
    expect(result?.status.value).toBe('error')
    expect(result?.error.value?.message).toMatch(/tanstack-fetch\/sse/)
    app.unmount()
  })
})
