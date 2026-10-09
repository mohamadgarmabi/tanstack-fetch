import { createContext } from 'solid-js'
import type { FetchClient } from 'tanstack-fetch'

type HttpFetchClient = Omit<FetchClient, 'sse'>
type AnyFetchClient = FetchClient | HttpFetchClient

const FetchContext = createContext<AnyFetchClient | null>(null)

export { FetchContext }
export type { AnyFetchClient, HttpFetchClient }
