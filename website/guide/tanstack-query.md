# TanStack Query

![useQuery, queryOptions, and useMutation with createFetch](/images/docs-tanstack-query.png)

`createFetch` matches what Query expects from a `queryFn`: return data, throw on failure, honor `signal`.

---

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
  queryFn: ({ signal }) => api.get<User[]>()('/users', { signal }),
})

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.get<User>()('/users/:id', { params: { id }, signal }),
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
    api.get<User>()('/users/:id', {
      params: { id: userId! },
      signal,
    }),
})
```

### Mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const queryClient = useQueryClient()

const createUser = useMutation({
  mutationFn: (body: { name: string; email: string }) => api.post('/users', { body }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

Copy-paste app: [`examples/tanstack-query`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query) · [React example](/examples/react)

---

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
  queryFn: ({ signal }) => api.get<User[]>()('/users', { signal }),
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
  queryFn: ({ signal }) => api.get<User[]>()('/users', { signal }),
})

const createUser = useMutation({
  mutationFn: (body: { name: string }) => api.post<User>()('/users', { body }),
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

---

## Always pass `signal`

```ts
queryFn: ({ signal }) => api.get('/users', { signal })
```

Cancel / unmount / query-key changes abort the request cleanly without treating abort as a failed HTTP response.
