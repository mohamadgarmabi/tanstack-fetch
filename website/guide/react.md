# React

Optional helpers from `tanstack-fetch/react`.

## Live demo

<ReactQueryDemo />

## `FetchProvider`

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

Or pass an existing client:

```tsx
const api = createFetch({ baseUrl: '…', getToken: … })

<FetchProvider client={api}>
  <App />
</FetchProvider>
```

## `useSse`

Requires a client from **`tanstack-fetch/sse`** (not the HTTP-only entry).

`status`: `'connecting' | 'connected' | 'disconnected' | 'error'` — `isConnected` was removed in **1.4.1**.

### Live demo

<UseSseDemo />

### Full example

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { FetchProvider, useSse } from 'tanstack-fetch/react'

type OrderEvent = { id: string; status: string }

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    enabled: true,
    onMessage: (payload) => {
      console.log('tick', payload)
    },
  })

  if (status === 'error') {
    return <p>Stream failed: {error?.message}</p>
  }

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

const App = () => (
  <FetchProvider client={api}>
    <OrdersLive />
  </FetchProvider>
)
```

Cloneable app: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live) · also [SSE guide](./sse)
