import { createConfigInterceptors } from './plugins/config-interceptors'
import { pluginFactories } from './plugins'
import { createFetchError } from './fetch-error'
import { sendRequest } from './request'
import type {
  CreateFetchOptions,
  FetchClient,
  FetchErrorInfo,
  FetchResult,
  HttpInterceptor,
  HttpMethod,
  RequestOptions,
} from './types'

type FetchContext = {
  clientOptions: CreateFetchOptions
  interceptors: HttpInterceptor[]
}

const createFetchContext = (options: CreateFetchOptions = {}): FetchContext => {
  const clientOptions: CreateFetchOptions = {
    throwOnError: true,
    ...options,
  }

  const interceptors: HttpInterceptor[] = [
    ...createConfigInterceptors(clientOptions),
    ...(clientOptions.plugins ?? []).map((name) => pluginFactories[name]()),
    ...(clientOptions.interceptors ?? []),
  ]

  return { clientOptions, interceptors }
}

const createHttpClient = (context: FetchContext): Omit<FetchClient, 'sse'> => {
  const { clientOptions, interceptors } = context

  const use: FetchClient['use'] = (name, interceptor, config) => {
    const next: HttpInterceptor = {
      ...interceptor,
      name,
      order: config?.order ?? interceptor.order,
    }
    const existing = interceptors.findIndex((item) => item.name === name)
    if (existing >= 0) {
      interceptors.splice(existing, 1, next)
      return
    }
    interceptors.push(next)
  }

  const eject: FetchClient['eject'] = (name) => {
    const index = interceptors.findIndex((item) => item.name === name)
    if (index >= 0) {
      interceptors.splice(index, 1)
    }
  }

  const request = (async <T, E = FetchErrorInfo>(
    method: HttpMethod,
    path: string,
    requestOptions?: RequestOptions,
  ): Promise<T | FetchResult<T, E>> => {
    const result = await sendRequest<T, E>({
      method,
      path,
      requestOptions,
      client: clientOptions,
      interceptors,
    })
    const shouldThrow = requestOptions?.throwOnError ?? clientOptions.throwOnError ?? true
    if (!result.ok && shouldThrow) {
      throw createFetchError(result as FetchResult<never, FetchErrorInfo>)
    }
    if (shouldThrow && result.ok) {
      return result.data
    }
    return result
  }) as FetchClient['request']

  const bindMethod = (httpMethod: HttpMethod): FetchClient['get'] => {
    const bound = (path: string, requestOptions?: RequestOptions) =>
      request(httpMethod, path, requestOptions as never)
    return bound as FetchClient['get']
  }

  return {
    use,
    eject,
    request,
    get: bindMethod('GET'),
    post: bindMethod('POST'),
    put: bindMethod('PUT'),
    patch: bindMethod('PATCH'),
    delete: bindMethod('DELETE'),
  }
}

/** Tiny HTTP client (no SSE). For streams use `tanstack-fetch/sse`. */
const createFetch = (options?: CreateFetchOptions): Omit<FetchClient, 'sse'> =>
  createHttpClient(createFetchContext(options))

/** @deprecated Use createFetch */
const createClient = createFetch

export { createFetch, createClient, createFetchContext, createHttpClient }
export type { FetchContext }
