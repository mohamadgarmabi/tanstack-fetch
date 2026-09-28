---
title: SSE live demo
description: Live Server-Sent Events demos — api.sse and React useSse with status.
---

# SSE

## `api.sse`

Start the stream — real **`tanstack-fetch/sse`** against a mock `text/event-stream` (with Bearer token support).

<SseDemo />

## React `useSse`

Pass `{ client: api }` — **FetchProvider is optional**.

`status`: `connecting` | `connected` | `disconnected` | `error`.

<UseSseDemo />

## In your app

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
  })

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

Guide: [SSE](/guide/sse) · [React](/guide/react#usesse) · example: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)
