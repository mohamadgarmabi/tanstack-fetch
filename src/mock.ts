import type {
  CreateFetchOptions,
  CreateWebSocket,
  FetchMocks,
  MockHttpRoute,
  MockOptions,
  MockRequest,
  MockRoute,
  MockWsConnection,
} from './types'
import { MOCK_HEADER } from './constants'
import { defaultCreateWebSocket } from './utils/default-websocket'
import { wait } from './utils/signals'
import type { XhrSender } from './utils/xhr-upload'

type CompiledRoute = { route: MockRoute; regex: RegExp; keys: string[] }
type Match = { route: MockRoute; params: Record<string, string> }

const compile = (baseUrl: string | undefined, route: MockRoute): CompiledRoute => {
  const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(route.path)
  const pathname = absolute
    ? new URL(route.path).pathname
    : new URL(baseUrl ?? '/', 'http://localhost').pathname.replace(/\/$/, '') +
      (route.path.startsWith('/') ? route.path : `/${route.path}`)
  const keys: string[] = []
  const source = pathname
    .replace(/[.*+?^$()|[\]\\]/g, '\\$&')
    .replace(/:(\w+)|\{(\w+)\}/g, (_, colon?: string, brace?: string) => {
      keys.push((colon ?? brace) as string)
      return '([^/]+)'
    })
  return { route, keys, regex: new RegExp(`^${source}/?$`) }
}

const parseJson = (value: unknown) => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const encodeFrame = (data: unknown) =>
  typeof data === 'string' ||
  data instanceof ArrayBuffer ||
  ArrayBuffer.isView(data) ||
  (typeof Blob !== 'undefined' && data instanceof Blob)
    ? data
    : JSON.stringify(data)

const toText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value))

const sseChunk = (data: unknown) =>
  `${toText(data)
    .split('\n')
    .map((line) => `data: ${line}`)
    .join('\n')}\n\n`

const isIterable = (value: unknown): value is AsyncIterable<unknown> | Iterable<unknown> =>
  value != null &&
  typeof value === 'object' &&
  (Symbol.asyncIterator in value || Symbol.iterator in value)

/** Streams an (async) iterable; stops it when the reader cancels or the request aborts. */
const toStream = (
  items: AsyncIterable<unknown> | Iterable<unknown>,
  format: (item: unknown) => string,
  signal?: AbortSignal,
) => {
  const iterator =
    Symbol.asyncIterator in items
      ? (items as AsyncIterable<unknown>)[Symbol.asyncIterator]()
      : (items as Iterable<unknown>)[Symbol.iterator]()
  const encoder = new TextEncoder()
  const stop = () => void Promise.resolve(iterator.return?.()).catch(() => undefined)
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      signal?.addEventListener(
        'abort',
        () => {
          try {
            controller.error(signal.reason)
          } catch {
            // already closed
          }
          stop()
        },
        { once: true },
      )
    },
    pull: async (controller) => {
      const next = await iterator.next()
      if (next.done) controller.close()
      else controller.enqueue(encoder.encode(format(next.value)))
    },
    cancel: stop,
  })
}

/** Tags the response so DevTools can show which mock answered. */
const markMock = (response: Response, route: MockHttpRoute) => {
  try {
    response.headers.set(MOCK_HEADER, route.path)
  } catch {
    // immutable headers (e.g. Response.error()): leave untagged
  }
  return response
}

const toResponse = (result: unknown, route: MockHttpRoute, signal?: AbortSignal) => {
  if (result instanceof Response) return result
  if (result === undefined) return new Response(null, { status: 204 })
  if (route.sse || (isIterable(result) && Symbol.asyncIterator in result)) {
    const items = isIterable(result) ? result : [result]
    return route.sse
      ? new Response(toStream(items, sseChunk, signal), {
          headers: { 'content-type': 'text/event-stream' },
        })
      : new Response(
          toStream(items, (item) => `${JSON.stringify(item)}\n`, signal),
          {
            headers: { 'content-type': 'application/x-ndjson' },
          },
        )
  }
  return new Response(JSON.stringify(result), {
    headers: { 'content-type': 'application/json' },
  })
}

const createMockSocket = (
  url: string,
  match: Match,
  request: MockRequest,
  delayMs: number,
): WebSocket => {
  const listeners: Array<(data: unknown) => void> = []
  let cleanup: void | (() => void)
  const socket = {
    url,
    /** Read by `openWs` to tag the connection for DevTools. */
    mock: match.route.path,
    readyState: 0,
    onopen: null as ((event: Event) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onclose: null as ((event: CloseEvent) => void) | null,
    send: (data: unknown) => {
      if (socket.readyState !== 1) return
      listeners.forEach((listener) => listener(parseJson(data)))
    },
    close: (code = 1000, reason = '') => {
      if (socket.readyState >= 2) return
      socket.readyState = 3
      if (typeof cleanup === 'function') cleanup()
      queueMicrotask(() =>
        socket.onclose?.({ code, reason, wasClean: code === 1000 } as CloseEvent),
      )
    },
  }
  const connection: MockWsConnection = {
    send: (data) => {
      if (socket.readyState === 1) socket.onmessage?.({ data: encodeFrame(data) } as MessageEvent)
    },
    close: (code, reason) => socket.close(code, reason),
    onMessage: (listener) => void listeners.push(listener),
  }
  setTimeout(async () => {
    if (socket.readyState !== 0) return
    socket.readyState = 1
    try {
      // Handler first so its listeners see frames the client queued before open.
      cleanup = await (match.route as Extract<MockRoute, { ws: true }>).handler(connection, request)
    } catch (error) {
      socket.onerror?.(Object.assign(new Event('error'), { error }))
      socket.close(1011)
      return
    }
    socket.onopen?.(new Event('open'))
  }, delayMs)
  return socket as unknown as WebSocket
}

/**
 * Swaps `fetch` / `createWebSocket` (and the XHR progress sender) for
 * mocked versions. Interceptors (auth, retry, status, devtools) still run. Unmatched requests
 * go to the real transport.
 */
const applyMocks = (
  mocks: MockOptions,
  options: CreateFetchOptions,
  progress?: XhrSender,
): { options: CreateFetchOptions; progress?: XhrSender } => {
  // `mocks` is dropped so a client's options passed on (e.g. to createTRPCFetch) are not wrapped twice.
  const { mocks: _mocks, ...rest } = options
  if (mocks.enabled === false) return { options: rest, progress }
  const compiled = mocks.routes.map((route) => compile(options.baseUrl, route))

  const find = (ws: boolean, method: string, url: URL, headers: Headers): Match | undefined => {
    for (const { route, regex, keys } of compiled) {
      if (route.enabled === false || Boolean(route.ws) !== ws) continue
      if (!route.ws) {
        if ((route.method ?? 'GET') !== method.toUpperCase()) continue
        // SSE requests only match `sse: true` routes and vice versa, so both can share a path.
        if (Boolean(route.sse) !== Boolean(headers.get('accept')?.includes('text/event-stream')))
          continue
      }
      const found = regex.exec(url.pathname)
      if (!found) continue
      const params: Record<string, string> = {}
      keys.forEach((key, index) => (params[key] = decodeURIComponent(found[index + 1] as string)))
      return { route, params }
    }
    return undefined
  }

  const toRequest = (match: Match, url: URL, init: RequestInit = {}): MockRequest => ({
    method: (init.method ?? 'GET').toUpperCase(),
    url,
    params: match.params,
    query: url.searchParams,
    headers: new Headers(init.headers),
    body: parseJson(init.body),
    signal: init.signal ?? undefined,
  })

  const realFetch = options.fetch
  const fetchMock = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), 'http://localhost')
    const match = find(false, init?.method ?? 'GET', url, new Headers(init?.headers))
    if (!match) return (realFetch ?? globalThis.fetch)(input, init)
    const request = toRequest(match, url, init)
    await wait(match.route.delayMs ?? mocks.delayMs ?? 0, request.signal)
    const route = match.route as MockHttpRoute
    return markMock(toResponse(await route.handler(request), route, request.signal), route)
  }) as typeof fetch

  const realSocket = options.createWebSocket ?? defaultCreateWebSocket
  const createWebSocket: CreateWebSocket = (url, init) => {
    const parsed = new URL(url)
    const headers = new Headers(init.headers)
    const match = find(true, 'GET', parsed, headers)
    if (!match) return realSocket(url, init)
    const request = toRequest(match, parsed, { headers })
    return createMockSocket(url, match, request, match.route.delayMs ?? mocks.delayMs ?? 0)
  }

  return {
    options: { ...rest, fetch: fetchMock, createWebSocket },
    // shortcut: mocked uploads skip XHR, so onUploadProgress / onDownloadProgress never fire.
    progress:
      progress &&
      ((args) =>
        find(false, args.method, args.url, args.headers)
          ? fetchMock(args.url, args as RequestInit)
          : progress(args)),
  }
}

/**
 * Mock routes for `createFetch({ mocks })`. Lives in its own entry so apps that never import it
 * ship none of this code.
 *
 * ```ts
 * import { createMocks } from 'tanstack-fetch/mock'
 * createFetch({ baseUrl, mocks: createMocks({ routes: [{ path: '/users', handler: () => [] }] }) })
 * ```
 */
const createMocks = (mocks: MockOptions): FetchMocks => ({
  install: (options, progress) => applyMocks(mocks, options, progress),
})

export { createMocks }
export type {
  FetchMocks,
  MockHttpRoute,
  MockOptions,
  MockRequest,
  MockRoute,
  MockWsConnection,
  MockWsRoute,
} from './types'
