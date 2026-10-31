import type { ReactNode } from 'react'
import type { CoreFetchClient, CreateFetchOptions, FetchClient } from 'tanstack-fetch'

type HttpFetchClient = Omit<FetchClient, 'sse'>

type FetchProviderProps = CreateFetchOptions & {
  children: ReactNode
  client?: FetchClient | HttpFetchClient | CoreFetchClient
}

export type { FetchProviderProps, HttpFetchClient }
