---
title: SSE live demo
description: Live Server-Sent Events demos — api.sse (core) plus React, Vue, Next, Solid, Angular, and Svelte patterns.
---

# SSE

Use the **Framework** picker in the header to filter stacks.

:::: framework core

## Core — `api.sse`

::: tip Framework
**Core** · `tanstack-fetch/sse` · works in every framework
:::

Start the stream — real **`tanstack-fetch/sse`** against a mock `text/event-stream` (with Bearer token support).

<SseDemo />

::::

:::: framework tanstack-start

## TanStack Start

::: tip Framework
**TanStack Start** · router route + `useSse` (browser)
:::

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({ plugins: ['sse-resume'] })

export const Route = createFileRoute('/orders/live')({
  component: () => {
    const { data, status, close } = useSse('/orders/stream', { client: api })
    return (
      <div>
        <p>{status}</p>
        <button type="button" onClick={close}>
          Stop
        </button>
      </div>
    )
  },
})
```

::::

:::: framework remix

## Remix

::: tip Framework
**Remix** · client-only `useSse`
:::

Same React hook — mount in a client component, not in `loader`.

::::

:::: framework solid-start

## SolidStart

::: tip Framework
**SolidStart** · `tanstack-fetch/solid`
:::

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/solid'

const api = createFetch({ plugins: ['sse-resume'] })
const { data, status, close } = useSse('/orders/stream', { client: api })
```

::::

:::: framework react

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

::::

:::: framework vue

## Vue / Nuxt `useSse`

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

::::

:::: framework nextjs

## Next.js

::: tip Framework
**Next.js** · `tanstack-fetch/react` (Client Component)
:::

Same as React `useSse` — mark the component `'use client'`. See [SSE · Next.js](/guide/sse#nextjs).

::::

:::: framework solid

## Solid `useSse`

::: tip Framework
**Solid** · `tanstack-fetch/solid`
:::

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/solid'

const api = createFetch({ plugins: ['sse-resume'] })

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
  })

  return (
    <div>
      <p>{status()}</p>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
      <button type="button" onClick={close}>
        Disconnect
      </button>
    </div>
  )
}
```

::::

:::: framework angular

## Angular `useSse`

::: tip Framework
**Angular** · `tanstack-fetch/angular`
:::

```ts
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/angular'

const api = createFetch({ plugins: ['sse-resume'] })

const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
  client: api,
})
// data / status / error are Angular signals
```

::::

:::: framework svelte

## Svelte / SvelteKit `useSse`

::: tip Framework
**Svelte** · `tanstack-fetch/svelte`
:::

```svelte
<script lang="ts">
  import { createFetch } from 'tanstack-fetch/sse'
  import { useSse } from 'tanstack-fetch/svelte'

  const api = createFetch({ plugins: ['sse-resume'] })
  const { data, status, error, close } = useSse('/orders/stream', { client: api })
</script>

<p>{$status}</p>
<pre>{JSON.stringify($data, null, 2)}</pre>
<button type="button" on:click={close}>Disconnect</button>
```

Browser-only in SvelteKit — see [Svelte guide](/guide/svelte).

::::

Guide: [SSE](/guide/sse) · example: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live) (**React**)
