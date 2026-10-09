---
title: tRPC + tanstack-fetch
description: Recipe for tRPC with createFetch — TanStack Start + Query first, Router context, SolidStart, Remix, React, Vue, and more.
---

# tRPC + tanstack-fetch

![tRPC transport via createFetch](/images/docs-trpc.png)

Same `createFetch` auth, plugins, and status handlers as REST — with tRPC on **TanStack Start**, **TanStack Query**, **TanStack Router** (context), **SolidStart**, **Remix**, React, Vue / Nuxt, Solid, Angular, Svelte / SvelteKit, and Next.js.

Use the **Framework** picker in the header to filter stacks.

Copy-paste React app: [examples/trpc](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc).  
Per-framework snippets: [tRPC guide](/guide/trpc).

:::: framework tanstack-start

## 1) TanStack Start + TanStack Query (recommended)

::: tip Framework
**TanStack Start** · `@tanstack/react-query` · `@trpc/tanstack-react-query`
:::

<InstallTabs packages="tanstack-fetch @trpc/client @trpc/tanstack-react-query @tanstack/react-query @tanstack/react-router @tanstack/react-start" />

### Shared client

Use a **relative** `/api/trpc` in the browser and an absolute origin on the server. Forward cookies with `ssr-forward` when needed.

```ts
// src/lib/trpc.ts
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
  plugins: ['ssr-forward', 'trace', 'retry-idempotent'],
  getToken: () =>
    typeof window === 'undefined' ? undefined : localStorage.getItem('access_token'),
  // on the server, wire cookies via incoming: () => ({ cookie: getRequestHeader('cookie') })
})

export const queryClient = new QueryClient()

export const trpcClient = createTRPCFetchClient<AppRouter>({
  url: getTrpcUrl(),
  client: api,
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
```

### Query in a component

```tsx
import { useQuery } from '@tanstack/react-query'
import { trpc } from '~/lib/trpc'

const Posts = () => {
  const { data, isPending } = useQuery(trpc.post.list.queryOptions())
  if (isPending) return <p>Loading…</p>
  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Router context (Start uses TanStack Router)

Pass `trpc` + `queryClient` on router context — loaders and components share one client.

```ts
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, trpc } from '~/lib/trpc'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  context: {
    trpc,
    queryClient,
  },
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### Route loader + `ensureQueryData`

```ts
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/posts')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.post.list.queryOptions()),
  component: PostsPage,
})

const PostsPage = () => {
  const { trpc } = Route.useRouteContext()
  const { data } = useQuery(trpc.post.list.queryOptions())
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

### Nested route — params from context

```ts
// src/routes/posts.$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/posts/$postId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.post.byId.queryOptions({ id: params.postId }),
    ),
  component: () => {
    const { postId } = Route.useParams()
    const { trpc } = Route.useRouteContext()
    const { data } = useQuery(trpc.post.byId.queryOptions({ id: postId }))
    return <article>{data?.title}</article>
  },
})
```

### Prefetch in `beforeLoad`

```ts
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(context.trpc.user.me.queryOptions())
  },
  component: Dashboard,
})
```

::::

:::: framework react

## 2) React SPA + TanStack Query

::: tip Framework
**React** · `@tanstack/react-query` · `@trpc/tanstack-react-query`
:::

<InstallTabs packages="tanstack-fetch @trpc/client @trpc/tanstack-react-query @tanstack/react-query" />

```ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from './server/router'

export const api = createFetch({
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => localStorage.removeItem('access_token'),
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

### TanStack Router context (SPA)

Same pattern as Start — register context on `createRouter`, then `Route.useRouteContext()`.

```ts
import { createRouter, createFileRoute } from '@tanstack/react-router'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { queryClient, trpc } from './trpc'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: { trpc, queryClient },
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})

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

::::

:::: framework solid-start

## 3) SolidStart + TanStack Query

::: tip Framework
**SolidStart** · `@tanstack/solid-query` · `@trpc/client` · optional `tanstack-fetch/solid`
:::

```ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import type { AppRouter } from '~/server/router'

const getTrpcUrl = () =>
  typeof window === 'undefined'
    ? `${process.env.SSR_ORIGIN ?? 'http://localhost:3000'}/api/trpc`
    : '/api/trpc'

export const api = createFetch({
  source: typeof window === 'undefined' ? 'ssr' : 'browser',
  plugins: ['ssr-forward', 'trace'],
})

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
      fetch: createTRPCFetch(api),
    }),
  ],
})
```

```tsx
import { createQuery } from '@tanstack/solid-query'
import { trpc } from '~/lib/api'

const Posts = () => {
  const posts = createQuery(() => ({
    queryKey: ['posts'],
    queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
  }))

  return (
    <ul>
      <For each={posts.data}>{(post) => <li>{post.title}</li>}</For>
    </ul>
  )
}
```

### Solid Router context

```ts
import { Router } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router root={RootLayout}>{/* file routes */}</Router>
  </QueryClientProvider>
)
```

Prefetch in a route `load` / `preload` function with the same `queryClient` + `trpc` pair used in Start’s loader pattern.

::::

:::: framework remix

## 4) Remix + TanStack Query

::: tip Framework
**Remix** · `@tanstack/react-query` · `@trpc/tanstack-react-query`
:::

Remix loaders run on the server — use absolute tRPC URL + `ssr-forward` for cookies. In the browser, use relative `/api/trpc`.

```ts
// app/lib/trpc.server.ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import type { AppRouter } from '~/server/router'

export const createServerApi = (request: Request) => {
  const api = createFetch({
    source: 'ssr',
    plugins: ['ssr-forward', 'trace'],
    incoming: () => ({ cookie: request.headers.get('cookie') ?? undefined }),
  })

  return createTRPCFetchClient<AppRouter>({
    url: `${process.env.SSR_ORIGIN ?? 'http://localhost:3000'}/api/trpc`,
    client: api,
  })
}
```

```ts
// app/routes/posts.tsx
import { useLoaderData } from '@remix-run/react'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { createServerApi } from '~/lib/trpc.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const trpc = createServerApi(request)
  const posts = await trpc.post.list.query()
  return json({ posts })
}

export default function Posts() {
  const { posts } = useLoaderData<typeof loader>()
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Remix + client Query (hydration)

```tsx
// app/root.tsx — wrap with QueryClientProvider
// app/routes/posts.tsx — loader dehydrates; component uses useQuery(trpc.post.list.queryOptions())
```

Same browser `trpc` + `queryClient` setup as the React SPA section; hydrate from the Remix loader payload.

::::

:::: framework nextjs

## Next.js

Same React + Query client. Relative `/api/trpc` in the browser, absolute origin on the server. See [tRPC · Next.js](/guide/trpc#nextjs).

::::

:::: framework vue

## Vue / Nuxt

Wire `@tanstack/vue-query`. See [tRPC · Vue](/guide/trpc#vue--nuxt).

::::

:::: framework solid

## Solid (client)

Wire `@tanstack/solid-query`. For SSR apps prefer [SolidStart](#3-solidstart--tanstack-query). See [tRPC · Solid](/guide/trpc#solid).

::::

:::: framework angular

## Angular

Wire `@tanstack/angular-query-experimental`. See [tRPC · Angular](/guide/trpc#angular).

::::

:::: framework svelte

## Svelte / SvelteKit

Wire `@tanstack/svelte-query`. See [tRPC · Svelte](/guide/trpc#svelte--sveltekit).

::::

:::: framework core

## Lower-level API

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch, createTRPCFetchLink } from 'tanstack-fetch/trpc'

// Option A
httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })

// Option B
createTRPCClient<AppRouter>({ links: [createTRPCFetchLink({ url: '/api/trpc', client: api })] })
```

::::
