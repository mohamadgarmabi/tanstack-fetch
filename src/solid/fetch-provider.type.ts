import type { JSX } from 'solid-js'
import type { CreateFetchOptions, FetchClient } from 'tanstack-fetch'
import type { HttpFetchClient } from './fetch-context'

type FetchProviderProps = CreateFetchOptions & {
  children?: JSX.Element
  client?: FetchClient | HttpFetchClient
}

export type { FetchProviderProps }
