import type {
  AuthConfig,
  CreateFetchOptions,
  HttpInterceptor,
  StatusHandler,
  StatusHandlers,
} from '../types'
import { createAuthInterceptor } from './auth'
import { createStatusInterceptor } from './status'

const assignStatusHandler = (
  handlers: StatusHandlers,
  key: keyof StatusHandlers,
  handler: StatusHandler | undefined,
) => {
  if (handler && handlers[key] === undefined) {
    handlers[key] = handler
  }
}

const mergeStatusHandlers = (options: CreateFetchOptions): StatusHandlers | undefined => {
  const handlers: StatusHandlers = { ...(options.onStatus ?? {}) }

  assignStatusHandler(handlers, 400, options.onBadRequest)
  assignStatusHandler(handlers, 401, options.onUnauthorized)
  assignStatusHandler(handlers, 403, options.onForbidden)
  assignStatusHandler(handlers, 404, options.onNotFound)
  assignStatusHandler(handlers, 405, options.onMethodNotAllowed)
  assignStatusHandler(handlers, 408, options.onRequestTimeout)
  assignStatusHandler(handlers, 409, options.onConflict)
  assignStatusHandler(handlers, 410, options.onGone)
  assignStatusHandler(handlers, 413, options.onPayloadTooLarge)
  assignStatusHandler(handlers, 415, options.onUnsupportedMediaType)
  assignStatusHandler(handlers, 422, options.onUnprocessableEntity)
  assignStatusHandler(handlers, 429, options.onTooManyRequests)
  assignStatusHandler(handlers, 451, options.onUnavailableForLegalReasons)
  assignStatusHandler(handlers, '4xx', options.onClientError)

  if (options.onServerError && handlers['5xx'] === undefined && handlers[500] === undefined) {
    handlers['5xx'] = options.onServerError
  }

  const hasHandler = Object.entries(handlers).some(([, handler]) => Boolean(handler))
  return hasHandler ? handlers : undefined
}

const resolveAuthConfig = (options: CreateFetchOptions): AuthConfig | undefined => {
  if (options.auth) {
    return options.auth
  }
  if (options.getToken) {
    return { getToken: options.getToken }
  }
  return undefined
}

const createConfigInterceptors = (options: CreateFetchOptions): HttpInterceptor[] => {
  const interceptors: HttpInterceptor[] = []
  const auth = resolveAuthConfig(options)
  if (auth) {
    interceptors.push(createAuthInterceptor(auth))
  }
  const statusHandlers = mergeStatusHandlers(options)
  if (statusHandlers) {
    interceptors.push(createStatusInterceptor(statusHandlers))
  }
  return interceptors
}

export { createConfigInterceptors, mergeStatusHandlers, resolveAuthConfig }
export type { StatusHandler }
