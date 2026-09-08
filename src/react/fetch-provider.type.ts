import type { ReactNode } from 'react'
import type { CreateFetchOptions, FetchClient } from '../types'

type FetchProviderProps = CreateFetchOptions & {
  children: ReactNode
  /** Pass an existing client instead of creating one from the other props. */
  client?: FetchClient
}

export type { FetchProviderProps }
