import type {
  ClientSource,
  HttpMethod,
  IncomingHeaders,
  MaybePromise,
  PathParams,
  PluginName,
  QueryParams,
} from './common.type'
import type { AuthConfig, StatusHandler, StatusHandlers } from './config.type'
import type { HttpInterceptor } from './interceptor.type'
import type { PathRequestArgs, WithPathParams } from './path-params.type'
import type { FetchErrorInfo, FetchResult } from './result.type'
import type { SseEvent, SseHandlers, SseSubscription } from './sse.type'
import type { UploadOptions, UploadProgressHandler } from './upload.type'

type RequestInterceptorConfig = {
  use?: HttpInterceptor[]
  eject?: string[]
}

type RequestOptions = {
  params?: PathParams
  query?: QueryParams
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  timeoutMs?: number
  /** Default `true` — matches TanStack Query `queryFn` (throw on HTTP error). */
  throwOnError?: boolean
  parseAs?: 'json' | 'text' | 'blob'
  operation?: string
  interceptors?: RequestInterceptorConfig
  /** Browser-only — uses XHR under the hood when set (fetch has no upload progress). */
  onUploadProgress?: UploadProgressHandler
}

type CreateFetchOptions = {
  baseUrl?: string
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>)
  source?: ClientSource
  incoming?: IncomingHeaders | (() => MaybePromise<IncomingHeaders>)
  timeoutMs?: number
  /** Default `true` for TanStack Query. Set `false` to get `FetchResult`. */
  throwOnError?: boolean
  interceptors?: HttpInterceptor[]
  plugins?: PluginName[]
  fetch?: typeof fetch
  credentials?: RequestCredentials
  maxRetries?: number

  /** Simple auth: attach Bearer token on every request. */
  getToken?: () => MaybePromise<string | null | undefined>
  /** Advanced auth config (overrides `getToken` when both set via `auth`). */
  auth?: AuthConfig

  /** Called on HTTP 400. */
  onBadRequest?: StatusHandler
  /** Called on HTTP 401 before the error is thrown / returned. */
  onUnauthorized?: StatusHandler
  /** Called on HTTP 403. */
  onForbidden?: StatusHandler
  /** Called on HTTP 404. */
  onNotFound?: StatusHandler
  /** Called on HTTP 405. */
  onMethodNotAllowed?: StatusHandler
  /** Called on HTTP 408. */
  onRequestTimeout?: StatusHandler
  /** Called on HTTP 409. */
  onConflict?: StatusHandler
  /** Called on HTTP 410. */
  onGone?: StatusHandler
  /** Called on HTTP 413. */
  onPayloadTooLarge?: StatusHandler
  /** Called on HTTP 415. */
  onUnsupportedMediaType?: StatusHandler
  /** Called on HTTP 422. */
  onUnprocessableEntity?: StatusHandler
  /** Called on HTTP 429 (rate limit). Prefer reading `Retry-After` via `parseRetryAfter`. */
  onTooManyRequests?: StatusHandler
  /** Called on HTTP 451. */
  onUnavailableForLegalReasons?: StatusHandler
  /** Called on any HTTP 4xx without a more specific handler. */
  onClientError?: StatusHandler
  /** Called on HTTP 5xx (500–599). */
  onServerError?: StatusHandler
  /** Advanced per-status map (`401`, `429`, `4xx`, `5xx`, `default`, …). */
  onStatus?: StatusHandlers
}

type ThrowingOptions = Omit<RequestOptions, 'throwOnError'> & { throwOnError?: true }
type ResultOptions = Omit<RequestOptions, 'throwOnError'> & { throwOnError: false }

type UploadCallOptions = Omit<RequestOptions, 'body' | 'onUploadProgress'> & UploadOptions

type ThrowingBase = Omit<ThrowingOptions, 'params'>
type ResultBase = Omit<ResultOptions, 'params'>
type UploadBase = Omit<UploadCallOptions, 'params'>

type FetchMethod = {
  <TData, TPath extends string = string>(
    path: TPath,
    ...args: PathRequestArgs<TPath, ThrowingBase>
  ): Promise<TData>
  <TData, TPath extends string = string, E = FetchErrorInfo>(
    path: TPath,
    ...args: PathRequestArgs<TPath, ResultBase & { throwOnError: false }>
  ): Promise<FetchResult<TData, E>>
}

type FetchRequest = {
  <TData, TPath extends string = string>(
    method: HttpMethod,
    path: TPath,
    ...args: PathRequestArgs<TPath, ThrowingBase>
  ): Promise<TData>
  <TData, TPath extends string = string, E = FetchErrorInfo>(
    method: HttpMethod,
    path: TPath,
    ...args: PathRequestArgs<TPath, ResultBase & { throwOnError: false }>
  ): Promise<FetchResult<TData, E>>
}

type UploadMethod = {
  <TData, TPath extends string = string>(
    path: TPath,
    ...args: PathRequestArgs<TPath, UploadBase & { throwOnError?: true }>
  ): Promise<TData>
  <TData, TPath extends string = string, E = FetchErrorInfo>(
    path: TPath,
    ...args: PathRequestArgs<TPath, UploadBase & { throwOnError: false }>
  ): Promise<FetchResult<TData, E>>
}

type SseCallOptions<T = unknown, TPath extends string = string> = Omit<RequestOptions, 'params'> &
  WithPathParams<TPath> &
  SseHandlers<T> & {
    lastEventId?: string
  }

type FetchClient = {
  use: (
    name: string,
    interceptor: Omit<HttpInterceptor, 'name'> & { name?: string },
    config?: { order?: number },
  ) => void
  eject: (name: string) => void
  request: FetchRequest
  get: FetchMethod
  post: FetchMethod
  put: FetchMethod
  patch: FetchMethod
  delete: FetchMethod
  /** Multipart / file upload — returns the same typed response body as `post`. */
  upload: UploadMethod
  /**
   * Simple: pass `onMessage` / `onEvent` → returns `{ close }`.
   * Advanced: no handlers → `AsyncIterable` for `for await`.
   */
  sse: {
    <T, TPath extends string = string>(
      path: TPath,
      options: SseCallOptions<T, TPath> &
        ({ onMessage: SseHandlers<T>['onMessage'] } | { onEvent: SseHandlers<T>['onEvent'] }),
    ): SseSubscription
    <T, TPath extends string = string>(
      path: TPath,
      ...args: PathRequestArgs<
        TPath,
        Omit<RequestOptions, 'params'> & SseHandlers<T> & { lastEventId?: string }
      >
    ): AsyncIterable<SseEvent<T>>
  }
}

/** @deprecated Use CreateFetchOptions */
type CreateClientOptions = CreateFetchOptions

/** @deprecated Use FetchClient */
type HttpClient = FetchClient

export type {
  RequestInterceptorConfig,
  RequestOptions,
  CreateFetchOptions,
  CreateClientOptions,
  FetchClient,
  HttpClient,
  ThrowingOptions,
  ResultOptions,
  FetchMethod,
  FetchRequest,
  UploadCallOptions,
  UploadMethod,
  SseCallOptions,
}
