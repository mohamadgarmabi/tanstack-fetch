import { createFetchContext, createHttpClient, type FetchContext } from './create-fetch'
import { pluginFactories } from './plugins'
import { createConfigInterceptors } from './plugins/config-interceptors'
import { resolveUploadBody } from './utils/form-data'
import { uploadWithProgress } from './utils/xhr-upload'
import type { CreateFetchOptions, FetchClient, UploadCallOptions } from './types'

/** Interceptors for the option shortcuts: auth, status handlers, plugin names. */
const createOptionInterceptors = (options: CreateFetchOptions) => [
  ...createConfigInterceptors(options),
  ...(options.plugins ?? []).map((name) => pluginFactories[name]()),
]

/** Context with every option shortcut plus XHR progress. */
const createFullFetchContext = (options: CreateFetchOptions = {}): FetchContext =>
  createFetchContext(options, createOptionInterceptors(options), uploadWithProgress)

/** Core HTTP client plus `upload()`. */
const createFullHttpClient = (context: FetchContext): Omit<FetchClient, 'sse'> => {
  const http = createHttpClient(context)
  const upload = ((path: string, uploadOptions?: UploadCallOptions) => {
    const { method = 'POST', file, files, fields, fieldName, body, ...rest } = uploadOptions ?? {}
    return http.request(method, path, {
      ...rest,
      body: resolveUploadBody({ body, file, files, fields, fieldName }),
      onUploadProgress: uploadOptions?.onUploadProgress,
    } as never)
  }) as FetchClient['upload']
  return { ...http, upload }
}

export { createFullFetchContext, createFullHttpClient, createOptionInterceptors }
