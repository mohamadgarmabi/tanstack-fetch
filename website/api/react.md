# React API

```ts
import { FetchProvider, useFetch, useSse } from 'tanstack-fetch/react'
```

| Export                  | Role                                |
| ----------------------- | ----------------------------------- |
| `FetchProvider`         | Optional shared client via context  |
| `useFetch()`            | Read client from `FetchProvider`    |
| `useSse(path, options)` | React SSE helper (needs SSE client) |

### `useSse` result

| Field    | Type                                                       |
| -------- | ---------------------------------------------------------- |
| `data`   | Last message payload                                       |
| `event`  | Last full SSE event                                        |
| `error`  | Last error                                                 |
| `status` | `'connecting' \| 'connected' \| 'disconnected' \| 'error'` |
| `close`  | Stop the stream                                            |

### `useSse` options

| Option   | Role                                      |
| -------- | ----------------------------------------- |
| `client` | SSE client from `tanstack-fetch/sse` (**preferred** — no provider) |
| `enabled` | When `false`, stays `disconnected`       |

### Example (no provider)

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<{ id: string }>('/orders/stream', {
    client: api,
  })

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
```

Live demo: [SSE — useSse](/guide/sse#react-usesse) · [React guide](/guide/react#usesse)
