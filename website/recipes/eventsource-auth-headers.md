---
title: EventSource auth headers
description: EventSource can’t set Authorization — use tanstack-fetch/sse over fetch, then refresh on reconnect.
---

# EventSource authentication headers

![EventSource auth headers](/images/page-recipes-eventsource-auth-headers.jpg)

**Problem:** `new EventSource('/orders/stream')` cannot set `Authorization`. Headers are ignored. Browsers refuse custom headers on EventSource.

**Solution:** Stream over native `fetch` with `tanstack-fetch/sse`, attach headers normally, and refresh tokens on `401` before reconnecting.

## Why EventSource fails auth

```ts
// Cannot set Authorization — browsers ignore it
const es = new EventSource('https://api.example.com/orders/stream', {
  headers: { Authorization: `Bearer ${token}` }, // ❌ not applied
})
```

## tanstack-fetch/sse (fetch-based stream)

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})

const stream = api.sse<OrderEvent>('/orders/stream', {
  headers: {
    Authorization: `Bearer ${api.getToken() ?? ''}`,
  },
  onMessage: (data) => console.log(data),
})
```

Headers set here are real HTTP headers — `Authorization` works.

## Reconnect with `Last-Event-ID`

Use [`sse-resume`](/guide/plugins) for Last-Event-ID resume after disconnect:

```ts
plugins: ['sse-resume'],
```

See [`/recipes/sse-resume`](/recipes/sse-resume).

## Auth on reconnect

Read token again before reconnect so a refreshed token is sent:

```ts
api.sse('/orders/stream', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`,
  },
})
```

## WebSocket has the same problem

Browser `WebSocket` can't send `Authorization` either. `api.ws` from `tanstack-fetch/live` makes the choice explicit (`authIn: 'query' | 'protocol'`), sends a real header on Node 22+ / Bun / Deno, and refetches the token on every reconnect. See [WebSocket guide · Auth](/guide/websocket#auth).

## Related

- [SSE](/guide/sse)
- [WebSocket, WebTransport & streams](/guide/websocket)
- [Plugins · sse-resume](/guide/plugins)
- [Refresh token](/recipes/refresh-token)
- [TanStack Query SSE](/guide/sse#cache-updates-with-query)
