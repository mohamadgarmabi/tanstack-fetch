import type {
  AuthConfig,
  CreateFetchOptions,
  HttpInterceptor,
  StatusHandler,
  StatusHandlers,
} from '../types'
import { createAuthInterceptor } from './auth'
import { createStatusInterceptor } from './status'

const mergeStatusHandlers = (options: CreateFetchOptions): StatusHandlers | undefined => {
  const handlers: StatusHandlers = { ...(options.onStatus ?? {}) }

  if (options.onUnauthorized && handlers[401] === undefined) {
    handlers[401] = options.onUnauthorized
  }
  if (options.onForbidden && handlers[403] === undefined) {
    handlers[403] = options.onForbidden
  }
  if (options.onNotFound && handlers[404] === undefined) {
    handlers[404] = options.onNotFound
  }
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
