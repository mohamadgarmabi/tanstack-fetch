---
title: SSE resume
description: Resume SSE stream after reconnect with Last-Event-ID — sse-resume plugin.
---

# SSE resume (Last-Event-ID)

![SSE resume](/images/page-recipes-sse-resume.jpg)

**Problem:** a Server-Sent Events stream drops: Wi-Fi changes, a proxy times out, the server restarts. Events sent while the client was away are lost, and a naive reconnect starts from scratch.

**Solution:** the server tags each event with `id:`. On reconnect, the client sends the last ID it saw in the `Last-Event-ID` header and the server replays what came after it. In tanstack-fetch, `api.sse` tracks the ID and sends the header, and the `sse-resume` plugin decides when to reconnect.

## Resume an SSE stream with the `sse-resume` plugin

```ts
import { createFetch } from 'tanstack-fetch/sse'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['sse-resume'],
})
```

On the core `tanstack-fetch` client there is no `api.sse`; use `tanstack-fetch/sse` or `/live`. You can also pass `createSseResumeInterceptor()` from `tanstack-fetch/plugins` in `interceptors`.

With the plugin, `api.sse('/orders/stream')`:

- **Reconnects on its own** after a network error, a mid-stream drop, or a 5xx when opening the stream, after a fixed **1 s** delay (since 2.2.1).
- **Sends `Last-Event-ID`** with the ID of the last event the server tagged with `id:`. Blocks that carry only an `id:` line also update it.
- **Fails on 4xx.** A `401` or `404` will not fix itself, so the error goes to `onError` (or is thrown from the loop) without retrying.
- **Drops heartbeats.** Events named `ping` or `heartbeat` never reach your handlers.

A stream the server ends cleanly is finished: it is not reopened. `close()` or aborting the `signal` during the 1 s wait also stops it for good.

## Retry budget: `maxRetries`

Reconnects count against the client's `maxRetries` (default `2`). The count **resets every time an event arrives**, so the budget limits back-to-back failures, not reconnects over the stream's lifetime. A stream that stays up for hours can survive any number of separate drops. Raise it for flaky networks:

```ts
const api = createFetch({ plugins: ['sse-resume'], maxRetries: 5 })
```

`maxRetries` also caps HTTP retries on the same client. When the budget runs out, the last error is reported: a `FetchError` with the status for an HTTP failure, or the original network error.

## Consume the stream

Callback style, feeding the TanStack Query cache so the UI updates without a refetch:

```ts
import { api } from './api'
import { queryClient } from './query-client'

type OrderEvent = { id: string; status: 'paid' | 'shipped' }

const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (order) => {
    queryClient.setQueryData<OrderEvent[]>(['orders'], (prev = []) => [...prev, order])
  },
  onError: (error) => console.error('stream failed', error),
})

// later
stream.close()
```

Async iteration: reconnects happen inside the loop, so it simply keeps yielding:

```ts
for await (const event of api.sse<OrderEvent>('/orders/stream', { signal })) {
  console.log(event.id, event.data)
}
```

To resume across page reloads, store the last ID and pass it back with `lastEventId`. It is sent on the first request too:

```ts
api.sse<OrderEvent>('/orders/stream', {
  lastEventId: localStorage.getItem('orders:last-id') ?? undefined,
  onEvent: (event) => {
    if (event.id) localStorage.setItem('orders:last-id', event.id)
  },
})
```

## Server side: handle `Last-Event-ID`

The client half only works if the server assigns IDs and replays from one. A Web-standard handler (Next.js route handlers, Hono, Bun, Deno, TanStack Start server routes):

```ts
type Order = { seq: number; id: string; status: string }
declare const ordersAfter: (seq: number) => Order[]
declare const onNewOrder: (listener: (order: Order) => void) => () => void

export const GET = (request: Request) => {
  const lastSeq = Number(request.headers.get('last-event-id') ?? 0)
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (order: Order) =>
        controller.enqueue(encoder.encode(`id: ${order.seq}\ndata: ${JSON.stringify(order)}\n\n`))

      ordersAfter(lastSeq).forEach(send) // replay what the client missed
      const unsubscribe = onNewOrder(send) // then stream live
      const ping = setInterval(
        () => controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n')),
        15_000,
      )

      request.signal.addEventListener('abort', () => {
        clearInterval(ping)
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
  })
}
```

Use an ID that orders events (a sequence number or a log offset) so "everything after X" is one query. The `ping` events keep proxies from closing an idle connection; `sse-resume` drops them on the client.

## Custom delays with `onSseError`

The plugin's delay is a fixed 1 s, and the server's `retry:` field does not change it. For other delays, add an interceptor whose `onSseError` runs before `sse-resume` (order below `20`). The first interceptor that returns `retry` wins:

```ts
import { parseRetryAfter } from 'tanstack-fetch'

api.use('sse-backoff', {
  order: 19,
  onSseError: (context) => {
    if (context.error?.status === 503) {
      return { action: 'retry', delayMs: parseRetryAfter(context.response?.headers) ?? 5_000 }
    }
    if (context.error?.code === 'NETWORK_ERROR') {
      return { action: 'retry', delayMs: 3_000 }
    }
    return { action: 'continue', context } // let sse-resume decide
  },
})
```

You don't need the plugin to resume: `api.sse` sends `Last-Event-ID` on every reconnect. Without it, only your own `onSseError` returning `{ action: 'retry', delayMs }` triggers reconnects. Headers you set in `onSseReconnect` are sent on the next connection.

## Related

- [SSE](/guide/sse): `api.sse`, `useSse` and POST streams
- [Plugin API](/api/plugins): `createSseResumeInterceptor` and the SSE hooks
- [EventSource auth headers](/recipes/eventsource-auth-headers)
- [Realtime example](/examples/realtime)
