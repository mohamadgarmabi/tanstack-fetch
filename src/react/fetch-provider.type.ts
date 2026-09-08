import type { ReactNode } from 'react'
import type { CreateFetchOptions, FetchClient } from '../types'

type HttpFetchClient = Omit<FetchClient, 'sse'>

type FetchProviderProps = CreateFetchOptions & {
  children: ReactNode
  client?: FetchClient | HttpFetchClient
}

export type { FetchProviderProps, HttpFetchClient }
