import type { CoreFetchClient, CreateFetchOptions, FetchClient } from './types'

type FetchClientLike = Omit<FetchClient, 'sse'> | FetchClient | CoreFetchClient

// Shared on globalThis: each bundled entry (dist/index.js, dist/trpc.js) has its own module copy.
const registryKey = Symbol.for('tanstack-fetch.clientOptions')
const registryHost = globalThis as { [registryKey]?: WeakMap<object, CreateFetchOptions> }
const clientOptionsRegistry = (registryHost[registryKey] ??= new WeakMap())

const registerClientOptions = (client: object, options: CreateFetchOptions) => {
  clientOptionsRegistry.set(client, options)
}

const isFetchClientLike = (value: unknown): value is FetchClientLike => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'get' in value &&
    typeof (value as FetchClientLike).get === 'function' &&
    'post' in value &&
    typeof (value as FetchClientLike).post === 'function',
  )
}

const resolveCreateFetchOptions = (
  source?: CreateFetchOptions | FetchClientLike,
): CreateFetchOptions => {
  if (!source) {
    return {}
  }
  if (isFetchClientLike(source)) {
    const registered = clientOptionsRegistry.get(source)
    if (!registered) {
      throw new Error(
        'tanstack-fetch: pass CreateFetchOptions or a client from createFetch() to createTRPCFetch',
      )
    }
    return registered
  }
  return source
}

export { registerClientOptions, resolveCreateFetchOptions, isFetchClientLike }
export type { FetchClientLike }
