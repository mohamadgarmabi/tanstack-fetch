---
title: SSE
description: Server-Sent Events over fetch with Authorization — api.sse, sse-resume, and React/Vue useSse helpers.
---

# SSE

![Server-Sent Events over fetch with Authorization](/images/docs-sse.png)

## Core — `api.sse`

::: tip Framework
**Core** (framework-agnostic) · `tanstack-fetch/sse`
:::

### Live demo

<SseDemo />

Import from `tanstack-fetch/sse` so streams use `fetch` (cookies + `Authorization` work).

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})
```

## Simple handlers

```ts
const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => console.log(data),
})

stream.close()
```

## Async iteration

```ts
for await (const event of api.sse<OrderEvent>('/orders/stream', { signal })) {
  console.log(event.data)
}
```

## React `useSse`

::: tip Framework
**React** · `tanstack-fetch/react`
:::

### Live demo

<UseSseDemo />

Pass the SSE client directly — **no FetchProvider**:

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({ plugins: ['sse-resume'] })

const LiveFeed = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
  })

  // status: 'connecting' | 'connected' | 'disconnected' | 'error'
  if (status === 'error') return <p>{error?.message}</p>

  return (
    <div>
      <p>{status}</p>
      <p>{data?.id}</p>
      <button type="button" onClick={close}>
        Stop
      </button>
    </div>
  )
}
```

Example: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live) · [React guide](/guide/react#usesse)

## Vue `useSse`

::: tip Framework
**Vue 3 / Nuxt** · `tanstack-fetch/vue`
:::

Same hook shape as React — returns **refs**. Pass `{ client: api }` (plugin optional).

```vue
<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

const api = createFetch({ plugins: ['sse-resume'] })

const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
  client: api,
})
</script>

<template>
  <p v-if="status === 'error'">{{ error?.message }}</p>
  <div v-else>
    <p>{{ status }}</p>
    <p>{{ data?.id }}</p>
    <button type="button" @click="close">Stop</button>
  </div>
</template>
```

Guide: [Vue & Nuxt](/guide/vue#usesse)
