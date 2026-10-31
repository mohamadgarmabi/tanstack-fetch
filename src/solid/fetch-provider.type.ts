import type { JSX } from 'solid-js'
import type { CoreFetchClient, CreateFetchOptions, FetchClient } from 'tanstack-fetch'
import type { HttpFetchClient } from './fetch-context'

type FetchProviderProps = CreateFetchOptions & {
  children?: JSX.Element
  client?: FetchClient | HttpFetchClient | CoreFetchClient
}

export type { FetchProviderProps }
