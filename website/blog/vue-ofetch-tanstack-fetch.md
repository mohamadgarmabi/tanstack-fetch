---
title: 'Vue ofetch / axios vs tanstack-fetch: typed fetch for Vue Query'
titleTemplate: false
description: "Replace ofetch and axios glue in Vue 3 with tanstack-fetch — createFetchPlugin, useFetch, useSse, Vue Query, refresh-token, and a full comparison."
date: 2026-10-12
category: Framework guides
tags: ["Vue","Comparison"]
cover: /images/blog-vue-ofetch-tanstack-fetch-cover.jpg
---

# Vue ofetch / axios vs tanstack-fetch

<p class="blog-meta">October 12, 2026 · Vue · TanStack Query · HTTP</p>

![Vue ofetch / axios vs tanstack-fetch: typed fetch for Vue Query](/images/blog-vue-ofetch-tanstack-fetch-cover.jpg)

::: tip Stack
**Vue 3.3+** · `tanstack-fetch/vue` · `@tanstack/vue-query`
:::

ofetch and axios are fine transporters. They are **not** shaped for Vue Query’s `queryFn` contract: return data, throw on failure, honor `AbortSignal`.

**tanstack-fetch** gives Vue the same client as React — via `createFetchPlugin` + `useFetch` composables.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| Drop into `useQuery` / `useMutation` | **tanstack-fetch** |
| Typed `FetchError` | **tanstack-fetch** |
| SSE + `Authorization` | `useSse` from `tanstack-fetch/vue` |
| Simple script without Query | ofetch is fine |
| Share client with React/Nuxt | **tanstack-fetch** |

```bash
npm install tanstack-fetch vue @tanstack/vue-query
```

## Mental model

ofetch returns the body on success but error shapes differ from Query’s expectations. axios still wants `.data`. One client should do both REST and SSE.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="g-vue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">SFC</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">script setup</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Vue Query</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">useQuery · cache</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g-vue)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">useFetch() · plugin</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">Vue plugin: createFetchPlugin → inject / useFetch</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">ofetch stays fine for one-off scripts outside Query</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so `isError` works)
3. Cancel → pass Query’s `signal` through

## Side-by-side

### axios / ofetch + Query (glue)

```ts
import axios from 'axios'
import { useQuery } from '@tanstack/vue-query'

const { data, error, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: async ({ signal }) => {
    const res = await axios.get<User[]>('/users', { signal })
    return res.data
  },
})
```

### tanstack-fetch + Vue Query

```ts
import { createApp } from 'vue'
import { createFetch } from 'tanstack-fetch'
import { createFetchPlugin, useFetch } from 'tanstack-fetch/vue'
import { VueQueryPlugin, useQuery } from '@tanstack/vue-query'
import { isFetchError } from 'tanstack-fetch'
import App from './App.vue'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})

createApp(App)
  .use(createFetchPlugin({ client: api }))
  .use(VueQueryPlugin)
  .mount('#app')
```

```vue
<script setup lang="ts">
import { useFetch } from 'tanstack-fetch/vue'
import { useQuery } from '@tanstack/vue-query'
import { isFetchError } from 'tanstack-fetch'

const api = useFetch()
const { data, error, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <p v-else-if="isFetchError(error)">{{ error.status }}</p>
  <ul v-else>
    <li v-for="u in data" :key="u.id">{{ u.name }}</li>
  </ul>
</template>
```

## Bootstrap / wiring

Pass `createFetch` options straight into `createFetchPlugin({ baseUrl, getToken, … })` if you do not want a separate `api` module.

In Nuxt, rename when `useFetch` clashes: `import { useFetch as useFetchClient } from 'tanstack-fetch/vue'`.

## Comparison graph: where glue accumulates

Rough relative **boilerplate** (lower is better) — a map of where teams spend time, not a micro-benchmark.

<div class="blog-chart" role="img" aria-label="Boilerplate comparison chart">
  <div class="blog-chart-row">
    <span class="blog-chart-label">Query-ready GET</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 18%">tanstack-fetch</div>
      <div class="blog-chart-bar is-http" style="--w: 70%">axios + .data</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Typed HTTP errors</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 22%">FetchError</div>
      <div class="blog-chart-bar is-http" style="--w: 62%">ofetch createError</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">401 refresh + retry</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">refresh-token plugin</div>
      <div class="blog-chart-bar is-http" style="--w: 85%">custom interceptor</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE + Authorization</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 30%">useSse refs</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">EventSource / custom</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Share with React/Nuxt</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 20%">one createFetch</div>
      <div class="blog-chart-bar is-http" style="--w: 88%">rewrite per app</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">typical ofetch / axios path</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | ofetch / axios |
| --- | --- | --- |
| Returns body for Query | Yes | Adapt |
| Typed error + status | `FetchError` | Partial |
| AbortSignal | First-class | Yes / vary |
| Status handlers | Built-in | Custom |
| Refresh single-flight | Plugin | Custom |
| Path params `:id` | Yes | Manual |
| SSE + Authorization | Yes | No |
| Vue composables | `useFetch` / `useSse` | DIY |
| Bundle | ~4.8KB gzip | Small–medium |

## Auth, status handlers, refresh

```ts
import { createFetch } from 'tanstack-fetch'
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

let expiresAt = 0

const api = createFetch({
  baseUrl: '/api',
  getToken: () => localStorage.getItem('access_token'),
})

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', {
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      localStorage.setItem('access_token', body.accessToken)
      expiresAt = Date.now() + body.expiresIn * 1000
    },
    before: { getExpiresAt: () => expiresAt, skewMs: 60_000 },
    after: { enabled: true },
  }),
)
```

The plugin keeps **one in-flight refresh** and retries the failed call — the usual interceptor queue, without the queue code.

## Mutations

```ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useFetch } from 'tanstack-fetch/vue'

const api = useFetch()
const queryClient = useQueryClient()
const createUser = useMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
```

## Live data: SSE

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`.

```vue
<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

const api = createFetch({ plugins: ['sse-resume'] })
const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
</script>

<template>
  <p v-if="status === 'error'">{{ error?.message }}</p>
  <div v-else>
    <p>{{ status }}</p>
    <pre>{{ data }}</pre>
    <button type="button" @click="close">Stop</button>
  </div>
</template>
```

Refs unwrap in the template. Plugin is optional when you pass `{ client }`.

Status: `connecting` | `connected` | `disconnected` | `error`.

<div class="blog-flow" aria-hidden="true">
  <div class="blog-flow-step">connecting</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step is-accent">connected</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step">onMessage → data</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step">close / unmount</div>
</div>

## tRPC over the same client

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { useQuery } from '@tanstack/vue-query'
import { api } from './api'
import type { AppRouter } from './server'

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

const posts = useQuery({
  queryKey: ['posts'],
  queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
})
```

## Migrate

```bash
npx tanstack-fetch migrate --from ofetch --framework vue --write
# or
npx tanstack-fetch migrate --from axios --framework vue --write
npx tanstack-fetch doctor --dir ./src
```

## Suggested folder layout

```text
src/
  main.ts              # createFetchPlugin + VueQueryPlugin
  lib/api.ts
  queries/users.ts
  components/UsersList.vue
  components/OrdersLive.vue
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → ofetch/axios may stay</li>
      </ul>
    </li>
    <li><strong>Do you need SSE with Authorization or resume?</strong>
      <ul>
        <li>Yes → <code>tanstack-fetch/sse</code> + <code>useSse</code></li>
        <li>No → either client works for simple REST</li>
      </ul>
    </li>
    <li><strong>Do other frameworks share this backend client?</strong>
      <ul>
        <li>Yes → one <code>createFetch</code> across packages</li>
        <li>No → still fine; adapters are optional</li>
      </ul>
    </li>
  </ol>
</div>

## Checklist

- [ ] `createFetchPlugin` registered
- [ ] Forward `{ signal }` in every queryFn
- [ ] `isFetchError` for status UI
- [ ] Refresh plugin instead of ad-hoc interceptors
- [ ] SSE via `tanstack-fetch/sse`
- [ ] Doctor clean

## Try it

```bash
npm install tanstack-fetch vue @tanstack/vue-query
npx tanstack-fetch doctor --dir ./src
```

## Related

- [Vue & Nuxt guide](/guide/vue)
- [SSE · Vue](/guide/sse#vue)
- [tRPC · Vue](/guide/trpc#vue)
- [Nuxt deep dive](/blog/nuxt-ofetch-tanstack-fetch)
- [Migrate](/guide/migrate)

## Series

Same deep-dive format for every stack:

- [React](/blog/react-axios-tanstack-fetch)
- [Next.js](/blog/nextjs-fetch-tanstack-fetch)
- [Nuxt](/blog/nuxt-ofetch-tanstack-fetch)
- [Solid](/blog/solid-fetch-tanstack-fetch)
- [TanStack Start / Router](/blog/tanstack-start-router-tanstack-fetch)
- [Svelte / SvelteKit](/blog/sveltekit-fetch-tanstack-fetch)
- [Angular](/blog/angular-http-client-tanstack-fetch)
