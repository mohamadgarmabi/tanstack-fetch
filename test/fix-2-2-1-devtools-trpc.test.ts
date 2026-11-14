/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFetch } from '../src'
import { createDevtools, mountDevtools, openWithEditor, parseFrame } from '../src/devtools'
import { createTRPCFetch } from '../src/trpc'
import { jsonResponse } from './helpers'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('devtools panel escapes network data (XSS)', () => {
  it('renders mock, caller, method, path and url as text, never HTML', () => {
    const { store } = createDevtools({ http: true })
    const payload = '<img src=x onerror="window.__pwned=1">'
    store.upsert({
      id: 'x:0',
      kind: 'http',
      status: 'success',
      method: `GET${payload}`,
      url: `https://a.test/"><b>${payload}`,
      path: `/p${payload}`,
      params: {},
      query: {},
      requestHeaders: {},
      responseHeaders: {},
      requestBytes: 0,
      responseBytes: 0,
      attempt: 0,
      maxRetries: 0,
      startedAt: 0,
      callStack: [],
      callerFile: payload,
      mock: payload,
    })
    store.select('x:0')
    const { destroy, root } = mountDevtools({ store, open: true })

    expect(root?.querySelector('img')).toBeNull()
    expect(root?.querySelector('b')).toBeNull()
    expect(root?.querySelector('.tf-dt-mock-badge')?.textContent).toBe(`mock · ${payload}`)
    expect(root?.querySelector('.tf-dt-caller-badge')?.textContent).toBe(payload)
    expect(root?.querySelector('.tf-dt-path')?.getAttribute('title')).toBe(
      `https://a.test/"><b>${payload}`,
    )
    expect(root?.querySelector('.tf-dt-pill.mock')).not.toBeNull()
    destroy()
  })
})

describe('devtools entry ids', () => {
  it('keeps concurrent requests without trace as separate entries', async () => {
    const { store, interceptor } = createDevtools({ http: true })
    const resolvers: Array<() => void> = []
    const fetchImpl: typeof fetch = () =>
      new Promise((resolve) => {
        resolvers.push(() => resolve(jsonResponse({ body: { ok: true } })))
      })
    const api = createFetch({
      baseUrl: 'https://a.test',
      fetch: fetchImpl,
      interceptors: [interceptor],
      maxRetries: 0,
    })

    const calls = [api.get('/one'), api.get('/two')]
    await vi.waitFor(() => expect(resolvers).toHaveLength(2))
    resolvers.forEach((resolve) => resolve())
    await Promise.all(calls)

    const entries = store.list('http')
    expect(entries).toHaveLength(2)
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(2)
    expect(entries.every((entry) => entry.status === 'success')).toBe(true)
  })

  it('shares the id across retry attempts with an attempt suffix', async () => {
    const { store, interceptor } = createDevtools({ http: true })
    let calls = 0
    const api = createFetch({
      baseUrl: 'https://a.test',
      fetch: async () => {
        calls += 1
        return calls === 1
          ? jsonResponse({ status: 503, body: { error: 'busy' } })
          : jsonResponse({ body: { ok: true } })
      },
      interceptors: [
        interceptor,
        {
          name: 'retry-once',
          onResponseError: (context) =>
            context.meta.attempt === 0 ? { action: 'retry' } : { action: 'continue' },
        },
      ],
      maxRetries: 1,
    })

    await api.get('/flaky')
    const ids = store.list('http').map((entry) => entry.id)
    expect(ids).toHaveLength(2)
    const bases = new Set(ids.map((id) => id.replace(/:\d+$/, '')))
    expect(bases.size).toBe(1)
    expect(ids.map((id) => id.split(':').at(-1)).sort()).toEqual(['0', '1'])
  })
})

describe('devtools stack frame parsing', () => {
  it('parses V8 dev-server URLs with a port and query to a project-relative path', () => {
    expect(
      parseFrame('    at loadUser (http://localhost:5173/src/api/user.ts?t=1:10:5)'),
    ).toMatchObject({ functionName: 'loadUser', fileName: 'src/api/user.ts', line: 10, column: 5 })
    expect(parseFrame('    at http://localhost:5173/src/api/user.ts:3:7')).toMatchObject({
      functionName: '<anonymous>',
      fileName: 'src/api/user.ts',
      line: 3,
      column: 7,
    })
  })

  it('parses Firefox / Safari `fn@url:line:col` frames', () => {
    expect(parseFrame('loadUser@http://localhost:5173/src/api/user.ts?t=1:10:5')).toMatchObject({
      functionName: 'loadUser',
      fileName: 'src/api/user.ts',
      line: 10,
      column: 5,
    })
    expect(parseFrame('@http://localhost:5173/src/main.tsx:1:1')).toMatchObject({
      functionName: '<anonymous>',
      fileName: 'src/main.tsx',
    })
  })

  it('keeps absolute paths for file:// and Vite /@fs/ URLs', () => {
    expect(parseFrame('    at f (file:///Users/me/app/src/x.ts:2:3)')?.fileName).toBe(
      '/Users/me/app/src/x.ts',
    )
    expect(parseFrame('    at f (/Users/me/app/src/x.ts:2:3)')?.fileName).toBe(
      '/Users/me/app/src/x.ts',
    )
  })

  it('skips non-source frames', () => {
    expect(parseFrame('    at node:internal/process/task_queues:95:5')).toBeNull()
    expect(parseFrame('    at <anonymous>')).toBeNull()
  })

  it('opens project-relative paths through the dev server, absolute ones by deep link', () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchSpy)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const clicks = () => click.mock.contexts.map((anchor) => (anchor as HTMLAnchorElement).href)

    openWithEditor(
      { functionName: 'f', fileName: 'src/api/user.ts', line: 10, column: 5, raw: '' },
      'vscode',
    )
    expect(fetchSpy).toHaveBeenCalledWith(
      `/__open-in-editor?file=${encodeURIComponent('src/api/user.ts:10:5')}`,
    )
    expect(clicks()).toEqual([])

    openWithEditor(
      { functionName: 'f', fileName: '/abs/x.ts', line: 1, column: 2, raw: '' },
      'vscode',
    )
    expect(clicks()).toEqual(['vscode://file/abs/x.ts:1:2'])
  })
})

describe('tRPC url resolution', () => {
  const ok = () => vi.fn().mockResolvedValue(jsonResponse({ body: { result: { data: {} } } }))

  it('keeps the baseUrl path prefix like core requests', async () => {
    const fetchImpl = ok()
    const trpcFetch = createTRPCFetch({
      fetch: fetchImpl,
      baseUrl: 'https://api.x.com/v1',
      maxRetries: 0,
    })
    await trpcFetch('/trpc/posts.list?batch=1', { method: 'GET' })
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      'https://api.x.com/v1/trpc/posts.list?batch=1',
    )
  })

  it('keeps origin-only baseUrl and absolute link urls unchanged', async () => {
    const fetchImpl = ok()
    const trpcFetch = createTRPCFetch({
      fetch: fetchImpl,
      baseUrl: 'http://localhost:3000',
      maxRetries: 0,
    })
    await trpcFetch('/api/trpc/a', { method: 'GET' })
    await trpcFetch('https://other.test/api/trpc/b', { method: 'GET' })
    expect(fetchImpl.mock.calls.map((call) => String(call[0]))).toEqual([
      'http://localhost:3000/api/trpc/a',
      'https://other.test/api/trpc/b',
    ])
  })

  it('resolves relative urls against location in the browser', async () => {
    const fetchImpl = ok()
    const trpcFetch = createTRPCFetch({ fetch: fetchImpl, maxRetries: 0 })
    await trpcFetch('/api/trpc/a', { method: 'GET' })
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(`${location.origin}/api/trpc/a`)
  })

  it('throws on the server when the url is relative and there is no absolute baseUrl', async () => {
    vi.stubGlobal('location', undefined)
    const trpcFetch = createTRPCFetch({ fetch: ok(), maxRetries: 0 })
    await expect(trpcFetch('/api/trpc/a', { method: 'GET' })).rejects.toThrow(/absolute baseUrl/)
  })
})

describe('tRPC timeout', () => {
  it('clears the per-attempt timeout timer once the attempt ends', async () => {
    vi.useFakeTimers()
    try {
      const trpcFetch = createTRPCFetch({
        fetch: vi.fn().mockResolvedValue(jsonResponse({ body: {} })),
        baseUrl: 'https://a.test',
        timeoutMs: 60_000,
        maxRetries: 0,
      })
      await trpcFetch('/trpc/a', { method: 'GET' })
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
