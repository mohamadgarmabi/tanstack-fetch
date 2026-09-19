import type { CreateFetchOptions, FetchClient } from '../types'
import type { FetchClientLike } from '../client-options'

type CreateTRPCFetchSource = CreateFetchOptions | FetchClientLike

type CreateTRPCFetchLinkOptions = CreateFetchOptions & {
  /** tRPC HTTP endpoint — absolute or relative (`/api/trpc`, `/trpc`). */
  url: string
  /**
   * Reuse an existing `createFetch()` client (auth, plugins, status handlers).
   * When set, takes precedence over other createFetch fields on this object.
   */
  client?: Omit<FetchClient, 'sse'> | FetchClient
  /** Use `httpBatchLink` (default `true`) or plain `httpLink` when `false`. */
  batch?: boolean
}

export type { CreateTRPCFetchSource, CreateTRPCFetchLinkOptions }
