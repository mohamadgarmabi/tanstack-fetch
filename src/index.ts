import { createFetch, createClient } from './create-fetch'
import { createFetchError, isAbortError, isFetchError } from './fetch-error'
import { unwrap, unwrapAsync } from './utils/result'

export { createFetch, createClient }
export { createFetchError, isFetchError, isAbortError }
export { unwrap, unwrapAsync }
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
