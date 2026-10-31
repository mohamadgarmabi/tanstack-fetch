import { registerClientOptions } from './client-options'
import { createFetchError } from './fetch-error'
import { sendRequest } from './request'
import type { XhrSender } from './utils/xhr-upload'
import type {
  CoreFetchClient,
  CoreFetchOptions,
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
  /** XHR transport for upload / download progress — only wired by the full entries. */
  progress?: XhrSender
}

const createFetchContext = (
  options: CreateFetchOptions = {},
  features: HttpInterceptor[] = [],
  progress?: XhrSender,
): FetchContext => {
  const clientOptions: CreateFetchOptions = { ...options }
  const interceptors = [...features, ...(clientOptions.interceptors ?? [])]
  return { clientOptions, interceptors, progress }
}

const createHttpClient = (context: FetchContext): CoreFetchClient => {
  const { clientOptions, interceptors, progress } = context

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
  ): Promise<T> => {
    const result = await sendRequest<T, E>({
      method,
      path,
      requestOptions,
      client: clientOptions,
      interceptors,
      progress,
    })
    if (!result.ok) {
      throw createFetchError(result as FetchResult<never, FetchErrorInfo>)
    }
    return result.data
  }) as FetchClient['request']

  const bindMethod = (httpMethod: HttpMethod): FetchClient['get'] => {
    const bound = (path: string, requestOptions?: RequestOptions) =>
      request(httpMethod, path, requestOptions as never)
    return bound as FetchClient['get']
  }

  const client = {
    use,
    eject,
    request,
    get: bindMethod('GET'),
    post: bindMethod('POST') as FetchClient['post'],
    put: bindMethod('PUT') as FetchClient['put'],
    patch: bindMethod('PATCH') as FetchClient['patch'],
    delete: bindMethod('DELETE'),
  }

  registerClientOptions(client, clientOptions)
  return client
}

/**
 * Slim HTTP client. Add auth / status / trace via `interceptors` from `tanstack-fetch/plugins`;
 * for `upload()`, progress events, and option shortcuts use `tanstack-fetch/sse`.
 */
const createFetch = (options?: CoreFetchOptions): CoreFetchClient =>
  createHttpClient(createFetchContext(options))

/** @deprecated Use createFetch */
const createClient = createFetch

export { createFetch, createClient, createFetchContext, createHttpClient }
export type { FetchContext }
