---
title: tRPC
description: Wire createFetch into tRPC — TanStack Start + Query first, Router context, SolidStart, Remix, React, Vue, Solid, Angular, Svelte.
---

# tRPC

![tRPC httpBatchLink powered by createFetch](/images/docs-trpc.png)

`createTRPCFetchClient` / `createTRPCFetch` is **framework-agnostic**. Prefer **TanStack Start + TanStack Query** with router context when you can.

Use the **Framework** picker in the header to show one stack at a time.

Full recipe (Start, Router context, SolidStart, Remix): [tRPC + tanstack-fetch](/recipes/trpc).  
Example app: [`examples/trpc`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc).

:::: framework core

## Shared client

```ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import type { AppRouter } from './server'

export const api = createFetch({
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => localStorage.removeItem('access_token'),
  plugins: ['trace', 'retry-idempotent'],
})

export const trpcClient = createTRPCFetchClient<AppRouter>({
  url: '/api/trpc',
  client: api,
})
```

## Helpers

| Helper                                 | Role                        |
| -------------------------------------- | --------------------------- |
| `createTRPCFetch(api)`                 | `fetch` for `httpBatchLink` |
| `createTRPCFetchLink({ url, client })` | ready terminating link      |
| `createTRPCFetchClient<AppRouter>(…)`  | full client                 |

::::

:::: framework tanstack-start

## TanStack Start + TanStack Query

::: tip Framework
**TanStack Start** · `@tanstack/react-query` · Router context
:::

<InstallTabs packages="tanstack-fetch @trpc/client @trpc/tanstack-react-query @tanstack/react-query @tanstack/react-router" />

### Client + proxy

```ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from '~/server/router'

const getTrpcUrl = () =>
  typeof window === 'undefined'
    ? `${process.env.SSR_ORIGIN ?? 'http://localhost:3000'}/api/trpc`
    : '/api/trpc'

export const api = createFetch({
  source: typeof window === 'undefined' ? 'ssr' : 'browser',
  plugins: ['ssr-forward', 'trace'],
})

export const queryClient = new QueryClient()

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCFetchClient<AppRouter>({ url: getTrpcUrl(), client: api }),
  queryClient,
})
```

### Router context

```ts
import { createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, trpc } from '~/lib/trpc'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  context: { trpc, queryClient },
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})
```

### Loader + component

```ts
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/posts')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.post.list.queryOptions()),
  component: () => {
    const { trpc } = Route.useRouteContext()
    const { data } = useQuery(trpc.post.list.queryOptions())
    return <pre>{JSON.stringify(data, null, 2)}</pre>
  },
})
```

More patterns (nested params, `beforeLoad`): [recipe](/recipes/trpc#1-tanstack-start--tanstack-query-recommended).

::::

:::: framework react

## React

::: tip Framework
**React** · `@trpc/tanstack-react-query` · `@tanstack/react-query`
:::

<InstallTabs packages="tanstack-fetch @trpc/client @trpc/tanstack-react-query @tanstack/react-query" />

```ts
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { trpcClient } from './trpc'

const queryClient = new QueryClient()
const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient })

useQuery(trpc.post.list.queryOptions())
```

Router context (SPA): same as Start — see [recipe · Router](/recipes/trpc#tanstack-router-context-spa).

::::

:::: framework remix

## Remix

::: tip Framework
**Remix** · loader + optional TanStack Query hydration
:::

Create a per-request server client with `ssr-forward` + request cookies, then `loader` → `json`. Full example: [recipe · Remix](/recipes/trpc#4-remix--tanstack-query).

::::

:::: framework nextjs

## Next.js

::: tip Framework
**React** · Next.js App Router
:::

Same React setup. Relative `/api/trpc` in the browser, absolute origin on the server. Forward cookies with `ssr-forward` when needed.

::::

:::: framework solid-start

## SolidStart

::: tip Framework
**SolidStart** · `@tanstack/solid-query` · `@trpc/client`
:::

Absolute URL on the server, relative in the browser — same SSR pattern as Start. See [recipe · SolidStart](/recipes/trpc#3-solidstart--tanstack-query).

::::

:::: framework vue

## Vue / Nuxt

::: tip Framework
**Vue 3 / Nuxt** · `@tanstack/vue-query` · `@trpc/client`
:::

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { useQuery } from '@tanstack/vue-query'
import { api } from './api'
import type { AppRouter } from './server'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch: createTRPCFetch(api),
    }),
  ],
})

const posts = useQuery({
  queryKey: ['posts'],
  queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
})
```

::::

:::: framework solid

## Solid

::: tip Framework
**Solid** · `@tanstack/solid-query` · `@trpc/client` · optional `tanstack-fetch/solid`
:::

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { createQuery } from '@tanstack/solid-query'
import { api } from './api'
import type { AppRouter } from './server'

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

const posts = createQuery(() => ({
  queryKey: ['posts'],
  queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
}))
```

::::

:::: framework angular

## Angular

::: tip Framework
**Angular** · `@tanstack/angular-query-experimental` · `@trpc/client` · optional `tanstack-fetch/angular`
:::

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { api } from './api'
import type { AppRouter } from './server'

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

readonly posts = injectQuery(() => ({
  queryKey: ['posts'],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    trpc.post.list.query(undefined, { signal }),
}))
```

::::

:::: framework svelte

## Svelte / SvelteKit

::: tip Framework
**Svelte / SvelteKit** · `@tanstack/svelte-query` · `@trpc/client` · optional `tanstack-fetch/svelte`
:::

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { createQuery } from '@tanstack/svelte-query'
import { api } from './api'
import type { AppRouter } from './server'

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

export const postsQuery = () =>
  createQuery({
    queryKey: ['posts'],
    queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
  })
```

::::

## Related

- [Recipe · tRPC](/recipes/trpc) (Start, Router context, SolidStart, Remix)
- [TanStack Query](/guide/tanstack-query)
- [SSR](/guide/ssr)
- [Migrate scaffolds](/guide/migrate)
