---
title: SSE resume
description: Resume SSE stream after reconnect with Last-Event-ID — sse-resume plugin.
---

# SSE resume (Last-Event-ID)

![SSE resume](/images/page-recipes-sse-resume.jpg)

**Problem:** Network hiccups or reconnects drop in-flight server-sent events. `Last-Event-ID` tells the server where to resume so nothing is skipped.

**Solution:** Use `tanstack-fetch/sse` with `plugins: ['sse-resume']` to auto-resume with `Last-Event-ID` after disconnects.

## Basic setup

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['sse-resume'],
})
```

`api.sse('/orders/stream')` now:

- Sends `Last-Event-ID` header on reconnect
- Tracks the last received event ID
- Auto-resumes after the stream closes

## Async iteration reconnect

```ts
for await (const event of api.sse<OrderEvent>('/orders/stream', { signal })) {
  console.log(event.data) // resume continues where it left off
}
```

## With Query

Update Query cache inside `onMessage` so reconnected streams feed UI without refetch:

```ts
const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => {
    queryClient.setQueryData(['orders'], (prev) => [...prev, data])
  },
})
```

## Related

- [SSE](/guide/sse)
- [Plugins · sse-resume](/guide/plugins)
- [EventSource auth headers](/recipes/eventsource-auth-headers)
