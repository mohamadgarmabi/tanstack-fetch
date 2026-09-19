import type { CreateFetchOptions, FetchClient } from './types'

type FetchClientLike = Omit<FetchClient, 'sse'> | FetchClient

const clientOptionsRegistry = new WeakMap<object, CreateFetchOptions>()

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
