import { registerClientOptions } from '../client-options'
import { createFetchContext, createHttpClient } from '../create-fetch'
import { createSseApi } from '../sse-listen'
import type { CreateFetchOptions, FetchClient } from '../types'

/** Full client with SSE. Prefer this when you need `api.sse()`. */
const createFetch = (options: CreateFetchOptions = {}): FetchClient => {
  const context = createFetchContext(options)
  const http = createHttpClient(context)
  const client: FetchClient = {
    ...http,
    sse: createSseApi({
      client: context.clientOptions,
      interceptors: context.interceptors,
    }),
  }
  registerClientOptions(client, context.clientOptions)
  return client
}

/** @deprecated Use createFetch from `tanstack-fetch/sse` */
const createClient = createFetch

export { createFetch, createClient }
export type { CreateFetchOptions, FetchClient }
