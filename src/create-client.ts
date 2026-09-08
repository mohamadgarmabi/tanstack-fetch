import { pluginFactories } from './plugins'
import { sendRequest } from './request'
import { sendSse } from './sse'
import type {
  CreateClientOptions,
  HttpClient,
  HttpError,
  HttpInterceptor,
  HttpMethod,
  RequestOptions,
} from './types'

const createClient = (options: CreateClientOptions = {}): HttpClient => {
  const interceptors: HttpInterceptor[] = [
    ...(options.plugins ?? []).map((name) => pluginFactories[name]()),
    ...(options.interceptors ?? []),
  ]

  const use: HttpClient['use'] = (name, interceptor, config) => {
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

  const eject: HttpClient['eject'] = (name) => {
    const index = interceptors.findIndex((item) => item.name === name)
    if (index >= 0) {
      interceptors.splice(index, 1)
    }
  }

  const request = <T, E = HttpError>(
    method: HttpMethod,
    path: string,
    requestOptions?: RequestOptions,
  ) => sendRequest<T, E>({ method, path, requestOptions, client: options, interceptors })

  return {
    use,
    eject,
    request,
    get: (path, requestOptions) => request('GET', path, requestOptions),
    post: (path, requestOptions) => request('POST', path, requestOptions),
    put: (path, requestOptions) => request('PUT', path, requestOptions),
    patch: (path, requestOptions) => request('PATCH', path, requestOptions),
    delete: (path, requestOptions) => request('DELETE', path, requestOptions),
    sse: (path, requestOptions) => sendSse({ path, requestOptions, client: options, interceptors }),
  }
}

export { createClient }
