/**
 * @vitest-environment happy-dom
 */
import { createApp, createSSRApp, defineComponent, h, nextTick, reactive } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src/index'
import { useSse, useWs } from '../src/vue'
import { clearFetchClient, setFetchClient, useFetch } from '../src/svelte'

type Callbacks = Record<string, (...args: unknown[]) => void>

const fakeClient = () => {
  const calls: Callbacks[] = []
  const client = {
    sse: vi.fn((_path: string, options: Callbacks) => {
      calls.push(options)
      return { close: vi.fn() }
    }),
    ws: vi.fn((_path: string, options: Callbacks) => {
      calls.push(options)
      return { close: vi.fn(), send: vi.fn() }
    }),
  }
  return { client, calls }
}

const mountSetup = (setup: () => void) => {
  const app = createApp(
    defineComponent({
      setup: () => {
        setup()
        return () => h('div')
      },
    }),
  )
  app.mount(document.createElement('div'))
  return app
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('2.2.1 vue: no connection during SSR', () => {
  it.each(['sse', 'ws'] as const)('use%s does not connect on the server', async (kind) => {
    const { client } = fakeClient()
    let status: string | undefined
    const app = createSSRApp(
      defineComponent({
        setup: () => {
          const result =
            kind === 'sse'
              ? useSse('/events', { client: client as never })
              : useWs('/socket', { client: client as never })
          status = result.status.value
          return () => h('div')
        },
      }),
    )
    vi.stubGlobal('window', undefined)
    await renderToString(app)
    expect(client[kind]).not.toHaveBeenCalled()
    expect(status).toBe('disconnected')
  })
})

describe('2.2.1 vue: stale callbacks are ignored after re-subscribe', () => {
  it.each(['sse', 'ws'] as const)('use%s ignores the old subscription', async (kind) => {
    const { client, calls } = fakeClient()
    const options = reactive({ client: client as never, query: { page: 1 } })
    let result: { status: { value: string }; data: { value: unknown } } | undefined
    const app = mountSetup(() => {
      result = kind === 'sse' ? useSse('/events', options) : useWs('/socket', options)
    })
    expect(calls).toHaveLength(1)

    options.query = { page: 2 }
    await nextTick()
    expect(calls).toHaveLength(2)
    expect(result?.status.value).toBe('connecting')

    const old = calls[0]
    old.onClose?.()
    old.onError?.(new Error('old'))
    old.onMessage?.({ stale: true }, {})
    expect(result?.status.value).toBe('connecting')
    expect(result?.data.value).toBeUndefined()

    calls[1].onOpen?.()
    expect(result?.status.value).toBe('connected')
    app.unmount()
  })
})

describe('2.2.1 svelte: module client is browser-only', () => {
  it('setFetchClient outside a component is not shared on the server', () => {
    clearFetchClient()
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    vi.stubGlobal('window', undefined)
    setFetchClient({ client: api })
    expect(() => useFetch()).toThrow(/setFetchClient/)
    vi.unstubAllGlobals()
    expect(() => useFetch()).toThrow(/setFetchClient/)
    clearFetchClient()
  })

  it('still works in the browser', () => {
    clearFetchClient()
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    setFetchClient({ client: api })
    expect(useFetch()).toBe(api)
    clearFetchClient()
  })
})
