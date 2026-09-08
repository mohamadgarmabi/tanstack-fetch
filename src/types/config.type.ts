import type { MaybePromise } from './common.type'
import type { HttpInterceptor, RequestContext } from './interceptor.type'
import type { FetchErrorInfo } from './result.type'

type StatusHandlerInput = {
  status: number
  error: FetchErrorInfo
  context: RequestContext
}

type StatusHandlerResult =
  | void
  | { action: 'continue' }
  | { action: 'retry'; delayMs?: number }

type StatusHandler = (input: StatusHandlerInput) => MaybePromise<StatusHandlerResult>

type StatusHandlers = {
  401?: StatusHandler
  403?: StatusHandler
  404?: StatusHandler
  500?: StatusHandler
  '4xx'?: StatusHandler
  '5xx'?: StatusHandler
  default?: StatusHandler
} & {
  [status: number]: StatusHandler | undefined
}

type AuthConfig = {
  /** Return access token (or null/undefined to skip). */
  getToken: () => MaybePromise<string | null | undefined>
  /** Header name. Default: `authorization`. */
  header?: string
  /** Prefix before token. Default: `Bearer`. Use `''` for raw token. */
  scheme?: string
}

export type { StatusHandlerInput, StatusHandlerResult, StatusHandler, StatusHandlers, AuthConfig }
