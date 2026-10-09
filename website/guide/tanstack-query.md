---
title: TanStack Query
description: Use createFetch with TanStack Query — Start + Router context first, then React, Vue, Solid, and more.
---

# TanStack Query

![useQuery, queryOptions, and useMutation with createFetch](/images/docs-tanstack-query.png)

`createFetch` matches what Query expects from a `queryFn`: return data, throw on failure, honor `signal`.

Prefer **TanStack Start + TanStack Query** with **router context** when you ship a routed app.

Use the **Framework** picker to filter stacks.

:::: framework tanstack-start

## TanStack Start + Query + Router context

::: tip Framework
**TanStack Start** · `@tanstack/react-query` · `@tanstack/react-router`
:::

### Shared `queryOptions`

```ts
// src/queries/users.ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '~/lib/api'

type User = { id: string; name: string }

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) =>
      api.get<User, { id: string | number }>('/users/:id', { params: { id }, signal }),
  })
```

### Put Query on router context

```ts
// src/router.tsx
import { createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

export const queryClient = new QueryClient()

export const router = createRouter({
  routeTree,
  context: { queryClient },
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})
```

### Loader with `ensureQueryData`

```ts
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { usersQueryOptions } from '~/queries/users'

export const Route = createFileRoute('/users')({
  loader: ({ context }) => context.queryClient.ensureQueryData(usersQueryOptions),
  component: () => {
    const { data } = useQuery(usersQueryOptions)
    return (
      <ul>
        {data?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    )
  },
})
```

### Nested route — params + context

```ts
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { userQueryOptions } from '~/queries/users'

export const Route = createFileRoute('/users/$userId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(userQueryOptions(params.userId)),
  component: () => {
    const { userId } = Route.useParams()
    const { data } = useQuery(userQueryOptions(userId))
    return <h1>{data?.name}</h1>
  },
})
```

### Prefetch in `beforeLoad`

```ts
export const Route = createFileRoute('/account')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.prefetchQuery(usersQueryOptions)
  },
})
```

tRPC with the same context pattern: [tRPC recipe](/recipes/trpc#1-tanstack-start--tanstack-query-recommended).

::::

:::: framework react

## React

::: tip Framework
**React** · `@tanstack/react-query`
:::

### Live demo

<ReactQueryDemo />

### Shared `queryOptions`

```ts
// src/queries/users.ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '../lib/api'

type User = { id: string; name: string }

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) =>
      api.get<User, { id: string | number }>('/users/:id', { params: { id }, signal }),
  })
```

```tsx
import { useQuery } from '@tanstack/react-query'
import { usersQueryOptions } from '../queries/users'

const { data } = useQuery(usersQueryOptions)
```

### Params + `enabled`

```tsx
const { data, error, isPending } = useQuery({
  queryKey: ['users', userId],
  enabled: Boolean(userId),
  queryFn: ({ signal }) =>
    api.get<User, { id: string | number }>('/users/:id', {
      params: { id: userId! },
      signal,
    }),
})
```

### Mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { NoParams } from 'tanstack-fetch'
import { api } from '../lib/api'

const queryClient = useQueryClient()

const createUser = useMutation({
  mutationFn: (body: { name: string; email: string }) =>
    api.post<User, NoParams, { name: string; email: string }>('/users', { body }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

### TanStack Router context (SPA)

Same as Start — `createRouter({ context: { queryClient }, Wrap: … })` then `loader` / `Route.useRouteContext()`.

Copy-paste app: [`examples/tanstack-query`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query) · [React example](/examples/react)

::::

:::: framework remix

## Remix

::: tip Framework
**Remix** · loaders + optional `@tanstack/react-query`
:::

Use `createFetch` in loaders with `source: 'ssr'` and `ssr-forward` for cookies. Hydrate into Query on the client when you want shared cache — same `queryOptions` as React.

```ts
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { createFetch } from 'tanstack-fetch'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const api = createFetch({
    source: 'ssr',
    plugins: ['ssr-forward'],
    incoming: () => ({ cookie: request.headers.get('cookie') ?? undefined }),
  })
  const users = await api.get<User[]>('/users')
  return json({ users })
}
```

::::

:::: framework solid-start

## SolidStart + Solid Query

::: tip Framework
**SolidStart** · `@tanstack/solid-query`
:::

```ts
import { createQuery } from '@tanstack/solid-query'
import { api } from '~/lib/api'

const users = createQuery(() => ({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
}))
```

Wrap the app in `QueryClientProvider`. Prefetch in route `load` / `preload` with the same `queryClient` you put on context.

::::

:::: framework vue

## Vue

::: tip Framework
**Vue 3** · `@tanstack/vue-query` · Nuxt-ready
:::

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { createFetch } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
})

const { data, error, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

### With `useFetch` from the Vue entry

```vue
<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'
import { isFetchError } from 'tanstack-fetch'

const api = useFetchClient()
const queryClient = useQueryClient()

const { data, error, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

const createUser = useMutation({
  mutationFn: (body: { name: string }) => api.post<User>('/users', { body }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <p v-else-if="isFetchError(error)">{{ error.status }}: {{ error.message }}</p>
  <ul v-else>
    <li v-for="user in data" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

Plugin setup: [Vue & Nuxt](/guide/vue) · SSR hydrate: [SSR — Nuxt](/guide/ssr#nuxt)

::::

:::: framework solid

## Solid

::: tip Framework
**Solid** · `@tanstack/solid-query`
:::

```ts
import { createQuery } from '@tanstack/solid-query'
import { api } from './api'

const users = createQuery(() => ({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
}))
```

::::

:::: framework core

## Always pass `signal`

```ts
queryFn: ({ signal }) => api.get('/users', { signal })
```

Cancel / unmount / query-key changes abort the request cleanly without treating abort as a failed HTTP response.

::::
