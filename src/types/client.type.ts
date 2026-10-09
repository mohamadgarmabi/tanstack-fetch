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
import type {
  PathRequestArgs,
  WithPathParams,
  FetchMethodArgs,
  FetchMethodPath,
  FetchParamsConstraint,
  InferFetchData,
  UnsetFetchParams,
  UnsetFetchBody,
  ResolveFetchData,
} from './path-params.type'
import type { SseEvent, SseHandlers, SseSubscription } from './sse.type'
import type {
  DownloadProgressHandler,
  UploadOptions,
  UploadProgressHandler,
} from './upload.type'

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
  parseAs?: 'json' | 'text' | 'blob'
  operation?: string
  interceptors?: RequestInterceptorConfig
  /** Browser-only — uses XHR under the hood when set (fetch has no upload progress). */
  onUploadProgress?: UploadProgressHandler
  /** Browser-only — uses XHR under the hood when set (reliable download progress). */
  onDownloadProgress?: DownloadProgressHandler
}

type CreateFetchOptions = {
  baseUrl?: string
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>)
  source?: ClientSource
  incoming?: IncomingHeaders | (() => MaybePromise<IncomingHeaders>)
  timeoutMs?: number
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

type UploadCallOptions = Omit<RequestOptions, 'body' | 'onUploadProgress'> & UploadOptions

type RequestBase = Omit<RequestOptions, 'params'>
type UploadBase = Omit<UploadCallOptions, 'params'>

/**
 * - `api.get('/users/:id', { params })` — params from the URL
 * - `api.get<User>('/users/:id', { params })` — options required (path literal is lost by TS)
 * - `api.get<User, { id: number }>('/users/:id', { params })` — params typed as your map;
 *   path must include those keys as `:id` / `{id}`
 */
type FetchMethod = <
  TData = InferFetchData,
  TParams extends FetchParamsConstraint = UnsetFetchParams,
  TPath extends string = string,
>(
  path: FetchMethodPath<NoInfer<TParams>, TPath>,
  ...args: FetchMethodArgs<TData, NoInfer<TParams>, TPath, RequestBase>
) => Promise<ResolveFetchData<TData>>

/**
 * Like `FetchMethod`, plus optional body typing:
 * - `api.post<User, NoParams, CreateUser>('/users', { body })`
 * - `api.post<User, { id: number }, CreateUser>('/users/:id', { params, body })`
 */
type BodyFetchMethod = <
  TData = InferFetchData,
  TParams extends FetchParamsConstraint = UnsetFetchParams,
  TBody = UnsetFetchBody,
  TPath extends string = string,
>(
  path: FetchMethodPath<NoInfer<TParams>, TPath>,
  ...args: FetchMethodArgs<TData, NoInfer<TParams>, TPath, RequestBase, NoInfer<TBody>>
) => Promise<ResolveFetchData<TData>>

type FetchRequest = <
  TData = InferFetchData,
  TParams extends FetchParamsConstraint = UnsetFetchParams,
  TBody = UnsetFetchBody,
  TPath extends string = string,
>(
  method: HttpMethod,
  path: FetchMethodPath<NoInfer<TParams>, TPath>,
  ...args: FetchMethodArgs<TData, NoInfer<TParams>, TPath, RequestBase, NoInfer<TBody>>
) => Promise<ResolveFetchData<TData>>

type UploadMethod = <
  TData = InferFetchData,
  TParams extends FetchParamsConstraint = UnsetFetchParams,
  TPath extends string = string,
>(
  path: FetchMethodPath<NoInfer<TParams>, TPath>,
  ...args: FetchMethodArgs<TData, NoInfer<TParams>, TPath, UploadBase>
) => Promise<ResolveFetchData<TData>>

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
  post: BodyFetchMethod
  put: BodyFetchMethod
  patch: BodyFetchMethod
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
  FetchMethod,
  BodyFetchMethod,
  FetchRequest,
  UploadCallOptions,
  UploadMethod,
  SseCallOptions,
}
