import type { FetchClient } from 'tanstack-fetch'

type HttpFetchClient = Omit<FetchClient, 'sse'>
type AnyFetchClient = FetchClient | HttpFetchClient

const FETCH_CONTEXT_KEY = 'tanstack-fetch:client'

let moduleClient: AnyFetchClient | null = null

const setFetchClient = (client: AnyFetchClient) => {
  moduleClient = client
}

const getFetchClient = (): AnyFetchClient | null => moduleClient

const clearFetchClient = () => {
  moduleClient = null
}

export { FETCH_CONTEXT_KEY, clearFetchClient, getFetchClient, setFetchClient }
export type { AnyFetchClient, HttpFetchClient }
