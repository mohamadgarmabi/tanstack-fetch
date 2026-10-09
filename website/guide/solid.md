---
title: Solid
description: Solid helpers for tanstack-fetch — FetchProvider, useFetch, and useSse with TanStack Solid Query.
---

# Solid

::: tip Framework
**Solid** · `tanstack-fetch/solid` · `@tanstack/solid-query`
:::

Optional helpers from `tanstack-fetch/solid`. Same mental model as React — return data, throw `FetchError`, pass `{ signal }`.

## Install

```bash
npm install tanstack-fetch solid-js
# optional Query
npm install @tanstack/solid-query
```

`solid-js` is an optional peer (`>=1.8`).

## `FetchProvider` + `useFetch`

```tsx
import { createFetch } from 'tanstack-fetch'
import { FetchProvider, useFetch } from 'tanstack-fetch/solid'
import { createQuery } from '@tanstack/solid-query'
import { isFetchError } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})

const App = () => (
  <FetchProvider client={api}>
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const client = useFetch()
  const query = createQuery(() => ({
    queryKey: ['users'],
    queryFn: ({ signal }) => client.get<User[]>('/users', { signal }),
  }))

  if (query.isPending) return <p>Loading…</p>
  if (isFetchError(query.error)) return <p>{query.error.status}</p>
  return (
    <ul>
      {query.data?.map((user) => (
        <li>{user.name}</li>
      ))}
    </ul>
  )
}
```

## `useSse`

Create the client from **`tanstack-fetch/sse`**, then pass `{ client: api }`. **FetchProvider is not required.**

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/solid'

const api = createFetch({ plugins: ['sse-resume'] })

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
  })

  if (status() === 'error') return <p>{error()?.message}</p>

  return (
    <div>
      <p>{status()}</p>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
      <button type="button" onClick={close}>
        Stop
      </button>
    </div>
  )
}
```

## Migrate CLI

```bash
npx tanstack-fetch migrate --from axios --framework solid --write
```

## Related

- [SSE · Solid](/guide/sse#solid)
- [tRPC · Solid](/guide/trpc#solid)
- [Migrate](/guide/migrate)
