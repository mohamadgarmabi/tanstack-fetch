import { getContext, setContext } from 'svelte'
import { createFetch } from 'tanstack-fetch'
import type { CreateFetchOptions } from 'tanstack-fetch'
import {
  FETCH_CONTEXT_KEY,
  getFetchClient,
  setFetchClient as setModuleClient,
  type AnyFetchClient,
} from './fetch-context'

type SetFetchClientOptions = CreateFetchOptions & {
  client?: AnyFetchClient
}

const resolveClient = (options: SetFetchClientOptions = {}): AnyFetchClient => {
  if (options.client) return options.client
  const { client: _client, ...createOptions } = options
  return createFetch(createOptions as CreateFetchOptions)
}

/** Call in a parent `+layout.svelte` / root component `script` setup. */
const setFetchClient = (options: SetFetchClientOptions = {}): AnyFetchClient => {
  const client = resolveClient(options)
  setModuleClient(client)
  try {
    setContext(FETCH_CONTEXT_KEY, client)
  } catch {
    // Outside a Svelte component — module client still works for useFetch / useSse.
  }
  return client
}

const getContextFetchClient = (): AnyFetchClient | null => {
  try {
    return (getContext(FETCH_CONTEXT_KEY) as AnyFetchClient | undefined) ?? getFetchClient()
  } catch {
    return getFetchClient()
  }
}

export { getContextFetchClient, setFetchClient }
export type { SetFetchClientOptions }
