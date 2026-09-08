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
import type { FetchErrorInfo, FetchResult } from './result.type'
import type { SseEvent } from './sse.type'

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

  /** Called on HTTP 401 before the error is thrown / returned. */
  onUnauthorized?: StatusHandler
  /** Called on HTTP 403. */
  onForbidden?: StatusHandler
  /** Called on HTTP 404. */
  onNotFound?: StatusHandler
  /** Called on HTTP 5xx (500–599). */
  onServerError?: StatusHandler
  /** Advanced per-status map (`401`, `403`, `4xx`, `5xx`, `default`, …). */
  onStatus?: StatusHandlers
}

type ThrowingOptions = Omit<RequestOptions, 'throwOnError'> & { throwOnError?: true }
type ResultOptions = Omit<RequestOptions, 'throwOnError'> & { throwOnError: false }

type FetchMethod = {
  <T>(path: string, options?: ThrowingOptions): Promise<T>
  <T, E = FetchErrorInfo>(path: string, options: ResultOptions): Promise<FetchResult<T, E>>
}

type FetchRequest = {
  <T>(method: HttpMethod, path: string, options?: ThrowingOptions): Promise<T>
  <T, E = FetchErrorInfo>(
    method: HttpMethod,
    path: string,
    options: ResultOptions,
  ): Promise<FetchResult<T, E>>
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
  sse: <T>(path: string, options?: RequestOptions) => AsyncIterable<SseEvent<T>>
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
}
