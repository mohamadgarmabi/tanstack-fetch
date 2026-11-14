import type { CoreFetchClient, FetchClient } from 'tanstack-fetch'

type HttpFetchClient = Omit<FetchClient, 'sse'>
type AnyFetchClient = FetchClient | HttpFetchClient

const FETCH_CONTEXT_KEY = 'tanstack-fetch:client'

let moduleClient: AnyFetchClient | null = null

// Browser only: on the server this module is shared by every request, so one user's client
// (token, cookies) would leak into another request. SSR relies on Svelte context instead.
const isBrowser = () => typeof window !== 'undefined'

const setFetchClient = (client: AnyFetchClient | CoreFetchClient) => {
  if (isBrowser()) moduleClient = client as AnyFetchClient
}

const getFetchClient = (): AnyFetchClient | null => (isBrowser() ? moduleClient : null)

const clearFetchClient = () => {
  moduleClient = null
}

export { FETCH_CONTEXT_KEY, clearFetchClient, getFetchClient, setFetchClient }
export type { AnyFetchClient, HttpFetchClient }
