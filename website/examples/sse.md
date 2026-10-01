---
title: SSE live demo
description: Live Server-Sent Events demos — api.sse (core), React useSse, and Vue useSse with status.
---

# SSE

## Core — `api.sse`

::: tip Framework
**Core** · `tanstack-fetch/sse`
:::

Start the stream — real **`tanstack-fetch/sse`** against a mock `text/event-stream` (with Bearer token support).

<SseDemo />

## React `useSse`

::: tip Framework
**React** · `tanstack-fetch/react`
:::

Pass `{ client: api }` — **FetchProvider is optional**.

`status`: `connecting` | `connected` | `disconnected` | `error`.

<UseSseDemo />

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

## Vue `useSse`

::: tip Framework
**Vue 3 / Nuxt** · `tanstack-fetch/vue`
:::

```vue
<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
  client: api,
})
</script>

<template>
  <p v-if="status === 'error'">{{ error?.message }}</p>
  <div v-else>
    <p>{{ status }}</p>
    <pre>{{ data }}</pre>
    <button type="button" @click="close">Disconnect</button>
  </div>
</template>
```

Guide: [SSE](/guide/sse) · [React](/guide/react#usesse) · [Vue](/guide/vue#usesse) · example: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live) (**React**)
