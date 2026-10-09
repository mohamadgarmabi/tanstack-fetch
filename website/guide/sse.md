---
title: SSE
description: Server-Sent Events over fetch with Authorization — api.sse plus useSse for React, Vue, Solid, Angular, and Svelte.
---

# SSE

![Server-Sent Events over fetch with Authorization](/images/docs-sse.png)

`tanstack-fetch/sse` is **framework-agnostic**. Optional `useSse` helpers live in `tanstack-fetch/react`, `/vue`, `/solid`, `/angular`, and `/svelte`.

Use the **Framework** picker in the header to show one stack at a time.

:::: framework core

## Core — `api.sse`

::: tip Framework
**Core** (framework-agnostic) · `tanstack-fetch/sse`
:::

### Live demo

<SseDemo />

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})
```

### Simple handlers

```ts
const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => console.log(data),
})

stream.close()
```

### Async iteration

```ts
for await (const event of api.sse<OrderEvent>('/orders/stream', { signal })) {
  console.log(event.data)
}
```

::::

:::: framework tanstack-start

## TanStack Start

::: tip Framework
**TanStack Start** · `tanstack-fetch/react` · browser-only stream
:::

SSE is a **client** concern. Open the stream in a route component (or a child that only mounts in the browser). Prefer router context for the shared `api` / Query client; keep `useSse` in the component.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({ plugins: ['sse-resume'] })

export const Route = createFileRoute('/orders/live')({
  component: OrdersLive,
})

const OrdersLive = () => {
  const { data, status, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  return (
    <div>
      <p>{status}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button type="button" onClick={close}>
        Stop
      </button>
    </div>
  )
}
```

::::

:::: framework remix

## Remix

::: tip Framework
**Remix** · Client Component / browser-only
:::

Do not open SSE inside a loader. Use a client module (or `ClientOnly`) with `useSse` from `tanstack-fetch/react` — same as React.

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({ plugins: ['sse-resume'] })

export const OrdersLive = () => {
  const { data, status, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  return (
    <div>
      <p>{status}</p>
      <button type="button" onClick={close}>
        Stop
      </button>
    </div>
  )
}
```

::::

:::: framework solid-start

## SolidStart

::: tip Framework
**SolidStart** · `tanstack-fetch/solid` · browser-only
:::

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/solid'

const api = createFetch({ plugins: ['sse-resume'] })

const OrdersLive = () => {
  const { data, status, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  return (
    <div>
      <p>{status()}</p>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
      <button type="button" onClick={close}>
        Stop
      </button>
    </div>
  )
}
```

Keep the stream out of server entry / SSR load functions.

::::

:::: framework react

## React `useSse`

::: tip Framework
**React** · `tanstack-fetch/react` · Next.js Client Components
:::

### Live demo

<UseSseDemo />

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({ plugins: ['sse-resume'] })

const LiveFeed = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
  })

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

::::

:::: framework nextjs

## Next.js

::: tip Framework
**React** · Next.js App Router
:::

Use `useSse` in a **Client Component** (`'use client'`).

```tsx
'use client'

import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  plugins: ['sse-resume'],
})

export const OrdersLive = () => {
  const { data, status, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  return (
    <div>
      <p>{status}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button type="button" onClick={close}>
        Stop
      </button>
    </div>
  )
}
```

::::

:::: framework solid

## Solid

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

  if (status() === 'error') return <p>{error()?.message}</p>

  return (
    <div>
      <p>{status()}</p>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
      <button type="button" onClick={close}>
        Stop
      </button>
    </div>
  )
}
```

Guide: [Solid](/guide/solid#usesse)

::::

:::: framework angular

## Angular

::: tip Framework
**Angular** · `tanstack-fetch/angular`
:::

```ts
import { Component } from '@angular/core'
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/angular'

const api = createFetch({ plugins: ['sse-resume'] })

@Component({
  selector: 'app-orders-live',
  template: `
    <p>{{ status() }}</p>
    <pre>{{ data() | json }}</pre>
    <button type="button" (click)="close()">Stop</button>
  `,
})
export class OrdersLiveComponent {
  private readonly stream = useSse<OrderEvent>('/orders/stream', { client: api })
  readonly data = this.stream.data
  readonly status = this.stream.status
  readonly close = this.stream.close
}
```

Guide: [Angular](/guide/angular#usesse)

::::

:::: framework svelte

## Svelte / SvelteKit

::: tip Framework
**Svelte / SvelteKit** · `tanstack-fetch/svelte`
:::

```svelte
<script lang="ts">
  import { createFetch } from 'tanstack-fetch/sse'
  import { useSse } from 'tanstack-fetch/svelte'

  const api = createFetch({ plugins: ['sse-resume'] })
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
  })
</script>

{#if $status === 'error'}
  <p>{$error?.message}</p>
{:else}
  <p>{$status}</p>
  <pre>{JSON.stringify($data, null, 2)}</pre>
  <button type="button" on:click={close}>Stop</button>
{/if}
```

Keep streams in browser components. Guide: [Svelte](/guide/svelte#usesse)

::::

## Related

- [Examples · SSE](/examples/sse)
- [React](/guide/react#usesse) · [Vue](/guide/vue#usesse) · [Solid](/guide/solid) · [Angular](/guide/angular) · [Svelte](/guide/svelte)
- [Plugins · `sse-resume`](/guide/plugins)
