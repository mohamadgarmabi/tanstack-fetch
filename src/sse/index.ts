import { registerClientOptions } from '../client-options'
import { createFetchContext, createHttpClient } from '../create-fetch'
import { createSseApi } from '../sse-listen'
import type { CreateFetchOptions, FetchClient, FetchRoutes, NoRoutes } from '../types'

/** Full client with SSE. Prefer this when you need `api.sse()`. */
const createFetch = <TRoutes extends FetchRoutes = NoRoutes>(
  options: CreateFetchOptions = {},
): FetchClient<TRoutes> => {
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
  return client as FetchClient<TRoutes>
}

/** @deprecated Use createFetch from `tanstack-fetch/sse` */
const createClient = createFetch

export { createFetch, createClient }
export type { CreateFetchOptions, FetchClient, FetchRoutes }
