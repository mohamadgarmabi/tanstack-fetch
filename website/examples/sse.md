---
title: SSE live demo
description: Live Server-Sent Events demo using tanstack-fetch/sse over fetch.
---

# SSE

Start the stream — real **`tanstack-fetch/sse`** against a mock `text/event-stream` (with Bearer token support).

<SseDemo />

## In your app

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => console.log(data),
})

stream.close()
```

Guide: [SSE](/guide/sse) · example: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)
