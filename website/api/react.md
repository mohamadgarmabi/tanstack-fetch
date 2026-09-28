# React API

```ts
import { FetchProvider, useFetch, useSse } from 'tanstack-fetch/react'
```

| Export                  | Role                                |
| ----------------------- | ----------------------------------- |
| `FetchProvider`         | Share client / config via context   |
| `useFetch()`            | Read the client                     |
| `useSse(path, options)` | React SSE helper (needs SSE client) |

### `useSse` result

| Field    | Type                                                       |
| -------- | ---------------------------------------------------------- |
| `data`   | Last message payload                                       |
| `event`  | Last full SSE event                                        |
| `error`  | Last error                                                 |
| `status` | `'connecting' \| 'connected' \| 'disconnected' \| 'error'` |
| `close`  | Stop the stream                                            |

### `useSse` example

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { FetchProvider, useSse } from 'tanstack-fetch/react'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<{ id: string }>('/orders/stream')

  if (status === 'connecting') return <p>Connecting…</p>
  if (status === 'error') return <p>{error?.message}</p>

  return (
    <div>
      <p>{status}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button type="button" onClick={close}>
        Disconnect
      </button>
    </div>
  )
}

export const App = () => (
  <FetchProvider client={api}>
    <OrdersLive />
  </FetchProvider>
)
```

Live demo: [SSE — useSse](/guide/sse#react-usesse) · [React guide](/guide/react#usesse)
