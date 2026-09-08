import type {
  ClientSource,
  HttpMethod,
  IncomingHeaders,
  MaybePromise,
  PathParams,
  PluginName,
  QueryParams,
} from './common.type'
import type { HttpInterceptor } from './interceptor.type'
import type { HttpError, HttpResult } from './result.type'
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
  throwOnError?: boolean
  parseAs?: 'json' | 'text' | 'blob'
  operation?: string
  interceptors?: RequestInterceptorConfig
}

type CreateClientOptions = {
  baseUrl?: string
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>)
  source?: ClientSource
  incoming?: IncomingHeaders | (() => MaybePromise<IncomingHeaders>)
  timeoutMs?: number
  throwOnError?: boolean
  interceptors?: HttpInterceptor[]
  plugins?: PluginName[]
  fetch?: typeof fetch
  credentials?: RequestCredentials
  maxRetries?: number
}

type HttpClient = {
  use: (
    name: string,
    interceptor: Omit<HttpInterceptor, 'name'> & { name?: string },
    config?: { order?: number },
  ) => void
  eject: (name: string) => void
  request: <T, E = HttpError>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions,
  ) => Promise<HttpResult<T, E>>
  get: <T, E = HttpError>(path: string, options?: RequestOptions) => Promise<HttpResult<T, E>>
  post: <T, E = HttpError>(path: string, options?: RequestOptions) => Promise<HttpResult<T, E>>
  put: <T, E = HttpError>(path: string, options?: RequestOptions) => Promise<HttpResult<T, E>>
  patch: <T, E = HttpError>(path: string, options?: RequestOptions) => Promise<HttpResult<T, E>>
  delete: <T, E = HttpError>(path: string, options?: RequestOptions) => Promise<HttpResult<T, E>>
  sse: <T>(path: string, options?: RequestOptions) => AsyncIterable<SseEvent<T>>
}

export type { RequestInterceptorConfig, RequestOptions, CreateClientOptions, HttpClient }
