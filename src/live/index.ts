import { registerClientOptions } from '../client-options'
import { createFullFetchContext, createFullHttpClient } from '../create-fetch-full'
import { sendNdjson } from '../ndjson-stream'
import { createSseApi } from '../sse-listen'
import { openWs } from '../ws'
import type { CreateFetchOptions, LiveFetchClient } from '../types'

/** Client with every live transport: `api.sse()`, `api.ws()`, `api.transport()`, `api.stream()`. */
const createFetch = (options: CreateFetchOptions = {}): LiveFetchClient => {
  const context = createFullFetchContext(options)
  const base = { client: context.clientOptions, interceptors: context.interceptors }
  const client: LiveFetchClient = {
    ...createFullHttpClient(context),
    sse: createSseApi(base),
    ws: ((path: string, options?: never) => openWs(base, path, options)) as LiveFetchClient['ws'],
    transport: ((path: string, options?: object) =>
      openWs(base, path, {
        ...options,
        transport: 'webtransport',
      })) as LiveFetchClient['transport'],
    stream: ((path: string, options?: never) =>
      sendNdjson(base, path, options)) as LiveFetchClient['stream'],
  }
  registerClientOptions(client, context.clientOptions)
  return client
}

export { createFetch }
export type { CreateFetchOptions, LiveFetchClient }
