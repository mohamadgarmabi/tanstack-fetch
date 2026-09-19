import { createTRPCClient, httpBatchLink, httpLink } from '@trpc/client'
import type { AnyRouter } from '@trpc/server'
import { createTRPCFetch } from './create-trpc-fetch'
import type { CreateTRPCFetchLinkOptions } from './trpc.type'

const resolveFetchSource = (options: CreateTRPCFetchLinkOptions) => {
  const { url: _url, batch: _batch, client, ...fetchOptions } = options
  return client ?? fetchOptions
}

/**
 * Drop-in terminating link for tRPC that runs through `createFetch`
 * (auth, plugins, status handlers). Use with React, TanStack Router, or TanStack Start.
 */
const createTRPCFetchLink = (options: CreateTRPCFetchLinkOptions) => {
  const fetch = createTRPCFetch(resolveFetchSource(options))
  const createLink = options.batch === false ? httpLink : httpBatchLink
  return createLink({
    url: options.url,
    fetch,
  })
}

/**
 * One-liner tRPC client wired to `createFetch`.
 * Pair with `createTRPCOptionsProxy` from `@trpc/tanstack-react-query` for Query / Router / Start.
 */
const createTRPCFetchClient = <TRouter extends AnyRouter>(options: CreateTRPCFetchLinkOptions) =>
  createTRPCClient<TRouter>({
    links: [createTRPCFetchLink(options)],
  })

export { createTRPCFetchLink, createTRPCFetchClient }
