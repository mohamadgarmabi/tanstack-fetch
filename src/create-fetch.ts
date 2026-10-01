import { registerClientOptions } from './client-options'
import { createConfigInterceptors } from './plugins/config-interceptors'
import { pluginFactories } from './plugins'
import { createFetchError } from './fetch-error'
import { sendRequest } from './request'
import { resolveUploadBody } from './utils/form-data'
import type {
  CreateFetchOptions,
  FetchClient,
  FetchErrorInfo,
  FetchResult,
  HttpInterceptor,
  HttpMethod,
  RequestOptions,
  UploadCallOptions,
} from './types'

type FetchContext = {
  clientOptions: CreateFetchOptions
  interceptors: HttpInterceptor[]
}

const createFetchContext = (options: CreateFetchOptions = {}): FetchContext => {
  const clientOptions: CreateFetchOptions = { ...options }

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

  const request = async <T, E = FetchErrorInfo>(
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
    })
    if (!result.ok) {
      throw createFetchError(result as FetchResult<never, FetchErrorInfo>)
    }
    return result.data
  }

  const bindRequest = (): FetchClient['request'] => {
    const bound = ((...args: unknown[]) => {
      if (args.length === 0) {
        return (method: HttpMethod, path: string, requestOptions?: RequestOptions) =>
          request(method, path, requestOptions)
      }
      const [method, path, requestOptions] = args as [HttpMethod, string, RequestOptions?]
      return request(method, path, requestOptions)
    }) as FetchClient['request']
    return bound
  }

  const bindMethod = (httpMethod: HttpMethod): FetchClient['get'] => {
    const bound = ((...args: unknown[]) => {
      if (args.length === 0) {
        return (path: string, requestOptions?: RequestOptions) =>
          request(httpMethod, path, requestOptions)
      }
      const [path, requestOptions] = args as [string, RequestOptions?]
      return request(httpMethod, path, requestOptions)
    }) as FetchClient['get']
    return bound
  }

  const upload: FetchClient['upload'] = ((...args: unknown[]) => {
    const run = (path: string, uploadOptions?: UploadCallOptions) => {
      const { method = 'POST', file, files, fields, fieldName, body, ...rest } = uploadOptions ?? {}
      return request(method, path, {
        ...rest,
        body: resolveUploadBody({ body, file, files, fields, fieldName }),
        onUploadProgress: uploadOptions?.onUploadProgress,
      })
    }
    if (args.length === 0) {
      return run
    }
    const [path, uploadOptions] = args as [string, UploadCallOptions?]
    return run(path, uploadOptions)
  }) as FetchClient['upload']

  const client = {
    use,
    eject,
    request: bindRequest(),
    get: bindMethod('GET'),
    post: bindMethod('POST'),
    put: bindMethod('PUT'),
    patch: bindMethod('PATCH'),
    delete: bindMethod('DELETE'),
    upload,
  }

  registerClientOptions(client, clientOptions)
  return client
}

/** Tiny HTTP client (no SSE). For streams use `tanstack-fetch/sse`. */
const createFetch = (options?: CreateFetchOptions): Omit<FetchClient, 'sse'> =>
  createHttpClient(createFetchContext(options))

/** @deprecated Use createFetch */
const createClient = createFetch

export { createFetch, createClient, createFetchContext, createHttpClient }
export type { FetchContext }
