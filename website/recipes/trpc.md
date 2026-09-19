# tRPC + tanstack-fetch

Use the same `createFetch` auth, plugins, and status handlers as your REST client — with tRPC over React, TanStack Router, or TanStack Start.

Copy-paste app: Copy-paste app: [examples/trpc](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc).

```bash
npm install tanstack-fetch @trpc/client @trpc/tanstack-react-query @tanstack/react-query
```

## Shared client

```ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from './server/router'

export const api = createFetch({
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
  },
  plugins: ['trace', 'retry-idempotent'],
})

export const queryClient = new QueryClient()

export const trpcClient = createTRPCFetchClient<AppRouter>({
  url: '/api/trpc',
  client: api,
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
```

## React (TanStack Query)

```tsx
import { useQuery } from '@tanstack/react-query'
import { trpc } from './trpc'

const Posts = () => {
  const { data } = useQuery(trpc.post.list.queryOptions())
  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

## TanStack Router

Pass `trpc` + `queryClient` on router context (same pattern as the official tRPC + Router example):

```ts
import { createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, trpc } from './trpc'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: { trpc, queryClient },
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})
```

In a route loader / component:

```ts
export const Route = createFileRoute('/posts')({
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.post.list.queryOptions()),
  component: () => {
    const { trpc } = Route.useRouteContext()
    const { data } = useQuery(trpc.post.list.queryOptions())
    return <pre>{JSON.stringify(data, null, 2)}</pre>
  },
})
```

## TanStack Start

Same client — use a **relative** URL (`/api/trpc`) in the browser, and an absolute origin on the server:

```ts
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { createFetch } from 'tanstack-fetch'

const getTrpcUrl = () =>
  typeof window === 'undefined'
    ? `${process.env.SSR_ORIGIN ?? 'http://localhost:3000'}/api/trpc`
    : '/api/trpc'

export const api = createFetch({
  source: typeof window === 'undefined' ? 'ssr' : 'browser',
  plugins: ['ssr-forward', 'trace'],
  // forward cookies on the server:
  // incoming: () => ({ cookie: getRequestHeader('cookie') }),
})

export const trpcClient = createTRPCFetchClient<AppRouter>({
  url: getTrpcUrl(),
  client: api,
})
```

## Lower-level API

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch, createTRPCFetchLink } from 'tanstack-fetch/trpc'

// Option A
httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })

// Option B
createTRPCClient<AppRouter>({ links: [createTRPCFetchLink({ url: '/api/trpc', client: api })] })
```
