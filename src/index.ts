import { createFetch, createClient } from './create-fetch'
import { createFetchError, isAbortError, isFetchError } from './fetch-error'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from './plugins'
import { unwrap, unwrapAsync } from './utils/result'

export { createFetch, createClient }
export { createFetchError, isFetchError, isAbortError }
export { unwrap, unwrapAsync }
export {
  createAuthInterceptor,
  createStatusInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
}
export type { FetchError } from './fetch-error'
export type {
  CreateFetchOptions,
  CreateClientOptions,
  FetchClient,
  HttpClient,
  FetchErrorInfo,
  HttpError,
  HttpInterceptor,
  HttpMethod,
  FetchResult,
  HttpResult,
  IncomingHeaders,
  PluginName,
  RequestContext,
  RequestOptions,
  SseEvent,
  SseHandlers,
  SseSubscription,
  SseCallOptions,
  AuthConfig,
  StatusHandler,
  StatusHandlerInput,
  StatusHandlerResult,
  StatusHandlers,
} from './types'
