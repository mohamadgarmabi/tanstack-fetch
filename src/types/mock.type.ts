import type { XhrSender } from '../utils/xhr-upload'
import type { CreateFetchOptions } from './client.type'
import type { HttpMethod, MaybePromise } from './common.type'

type MockRequest = {
  method: string
  url: URL
  /** Values captured from `:id` / `{id}` segments of the route path. */
  params: Record<string, string>
  query: URLSearchParams
  headers: Headers
  /** JSON-parsed when possible, otherwise the raw body (string, FormData, Blob, …). */
  body: unknown
  signal?: AbortSignal
}

/** Server side of a mocked WebSocket. */
type MockWsConnection = {
  /** Push a frame to the client. Objects are JSON-stringified. */
  send: (data: unknown) => void
  close: (code?: number, reason?: string) => void
  /** Frames sent by the client (JSON-parsed when possible). */
  onMessage: (listener: (data: unknown) => void) => void
}

type MockRouteBase = {
  /** Relative to `baseUrl` (like the paths you pass to `api.get`), or absolute. Supports `:id` / `{id}`. */
  path: string
  /** Default `true`. Read on every request, so it can be toggled at runtime. */
  enabled?: boolean
  /** Simulated latency. Overrides `mocks.delayMs`. */
  delayMs?: number
}

type MockHttpRoute = MockRouteBase & {
  /** Default `GET`. */
  method?: HttpMethod
  /** Only match `api.sse()`; the handler returns an (async) iterable whose items are the event `data`. */
  sse?: boolean
  ws?: false
  /**
   * Return a `Response` as-is, data (sent as JSON 200), `undefined` (204), or an async iterable
   * (streamed as SSE for `sse: true`, otherwise NDJSON for `api.stream()`).
   */
  handler: (request: MockRequest) => unknown
}

type MockWsRoute = MockRouteBase & {
  ws: true
  /** Runs when the socket opens. Return a function to clean up when it closes. */
  handler: (connection: MockWsConnection, request: MockRequest) => MaybePromise<void | (() => void)>
}

type MockRoute = MockHttpRoute | MockWsRoute

type MockOptions = {
  /** Default `true`. When `false` nothing is mocked. */
  enabled?: boolean
  delayMs?: number
  /** First match wins; requests without a match go to the real network. */
  routes: MockRoute[]
}

/** Built by `createMocks()` from `tanstack-fetch/mock`; pass it as `createFetch({ mocks })`. */
type FetchMocks = {
  /** @internal Swaps the client's transports for the mocked ones. */
  apply: (
    options: CreateFetchOptions,
    progress?: XhrSender,
  ) => { options: CreateFetchOptions; progress?: XhrSender }
}

export type {
  FetchMocks,
  MockRequest,
  MockWsConnection,
  MockHttpRoute,
  MockWsRoute,
  MockRoute,
  MockOptions,
}
