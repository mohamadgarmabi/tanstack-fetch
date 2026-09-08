import type { HttpError, HttpResult } from './result.type'
import type { ClientSource, HttpMethod, IncomingHeaders, MaybePromise } from './common.type'

type RequestContext = {
  request: {
    method: HttpMethod
    url: URL
    headers: Headers
    body?: unknown
    signal?: AbortSignal
  }
  response?: Response
  data?: unknown
  error?: HttpError
  incoming?: IncomingHeaders
  meta: {
    attempt: number
    maxRetries: number
    source: ClientSource
    operation?: string
    requestId?: string
    lastEventId?: string
  }
}

type SseEventContext<T = unknown> = RequestContext & {
  event: {
    event?: string
    data: T
    id?: string
    retry?: number
  }
}

type InterceptorDecision<T> =
  | { action: 'continue'; context?: T }
  | { action: 'skip' }
  | { action: 'drop' }
  | { action: 'retry'; delayMs?: number }
  | { action: 'short-circuit'; result: HttpResult<unknown, unknown> }

type InterceptorHandler<T> = (context: T) => MaybePromise<InterceptorDecision<T> | void>

type HttpInterceptor = {
  name: string
  order?: number
  match?: {
    operation?: string
    method?: HttpMethod
    pathPrefix?: string
    status?: number
  }
  onRequest?: InterceptorHandler<RequestContext>
  onRequestError?: InterceptorHandler<RequestContext>
  onResponse?: InterceptorHandler<RequestContext>
  onResponseError?: InterceptorHandler<RequestContext>
  onSseOpen?: InterceptorHandler<RequestContext>
  onSseEvent?: InterceptorHandler<SseEventContext>
  onSseError?: InterceptorHandler<RequestContext>
  onSseReconnect?: InterceptorHandler<RequestContext>
}

export type {
  RequestContext,
  SseEventContext,
  InterceptorDecision,
  InterceptorHandler,
  HttpInterceptor,
}
