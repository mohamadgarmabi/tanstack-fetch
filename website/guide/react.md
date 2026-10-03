---
title: React
description: React helpers for tanstack-fetch — FetchProvider, useFetch, and useSse with TanStack React Query.
---

# React

::: tip Framework
**React** · `tanstack-fetch/react` · `@tanstack/react-query`
:::

Optional helpers from `tanstack-fetch/react`.

## Live demo

<ReactQueryDemo />

## `FetchProvider`

Optional — only if you want `useFetch()` from context. For SSE you can skip it and pass `client` to `useSse`.

```tsx
import { FetchProvider, useFetch } from 'tanstack-fetch/react'
import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'

const App = () => (
  <FetchProvider
    baseUrl={import.meta.env.VITE_API_URL}
    getToken={() => localStorage.getItem('access_token')}
    onUnauthorized={() => {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }}
    plugins={['trace', 'retry-idempotent']}
  >
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const api = useFetch()
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error))
    return (
      <p>
        {error.status}: {error.message}
      </p>
    )
  return (
    <ul>
      {data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}
```

## `useSse`

Create the client from **`tanstack-fetch/sse`**, then pass it as `{ client: api }`. **FetchProvider is not required.**

`status`: `'connecting' | 'connected' | 'disconnected' | 'error'`

### Live demo

<UseSseDemo />

### Recommended (no provider)

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

type OrderEvent = { id: string; status: string }

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
    onMessage: (payload) => console.log('tick', payload),
  })

  if (status === 'error') return <p>Stream failed: {error?.message}</p>

  return (
    <div>
      <p>status: {status}</p>
      <p>{data ? `${data.id} · ${data.status}` : 'waiting…'}</p>
      <button type="button" onClick={close} disabled={status === 'disconnected'}>
        Disconnect
      </button>
    </div>
  )
}
```

### Optional: via `FetchProvider`

If the tree already has `<FetchProvider client={api}>`, you can omit `client` and `useSse` reads it from context.

Cloneable app: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live) · [SSE guide](./sse)
