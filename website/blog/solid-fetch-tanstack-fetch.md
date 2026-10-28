---
title: 'Solid fetch / axios vs tanstack-fetch: Solid Query adapters'
titleTemplate: false
description: "Use tanstack-fetch with Solid — FetchProvider, useFetch, useSse signals, Solid Query, refresh-token, migrate CLI, and comparison graphs."
date: 2026-10-12
category: Framework guides
tags: ["Solid","Comparison"]
---

# Solid fetch vs tanstack-fetch

<p class="blog-meta">October 12, 2026 · Solid · TanStack Query · HTTP</p>

::: tip Stack
**Solid 1.8+** · `tanstack-fetch/solid` · `@tanstack/solid-query`
:::

Solid’s fine-grained reactivity loves small primitives. Raw `fetch` / axios still force you to unwrap bodies and map errors before `createQuery`.

**tanstack-fetch/solid** mirrors the React adapters: `FetchProvider`, `useFetch`, and `useSse` that return accessors.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| `createQuery` without `.data` unwrap | **tanstack-fetch** |
| SSE accessors (`status()`, `data()`) | `useSse` |
| Share client with React monorepo | same `createFetch` |
| Tiny app, no Query | native fetch is fine |

```bash
npm install tanstack-fetch solid-js @tanstack/solid-query
```

## Mental model

Solid Query’s `queryFn` is still Promise + AbortSignal. Accessors (`query.data`) are separate from the HTTP client contract.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="g-solid" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Component</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">JSX · signals</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Solid Query</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">createQuery</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g-solid)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">useFetch() · provider</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">FetchProvider → useFetch · useSse accessors</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">Native fetch stays fine outside Query</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so `isError` works)
3. Cancel → pass Query’s `signal` through

## Side-by-side

### axios + Solid Query (glue)

```tsx
import axios from 'axios'
import { createQuery } from '@tanstack/solid-query'

const query = createQuery(() => ({
  queryKey: ['users'],
  queryFn: async ({ signal }) => (await axios.get<User[]>('/users', { signal })).data,
}))
```

### tanstack-fetch + Solid Query

```tsx
import { createFetch } from 'tanstack-fetch'
import { FetchProvider, useFetch } from 'tanstack-fetch/solid'
import { createQuery } from '@tanstack/solid-query'
import { isFetchError } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})

const App = () => (
  <FetchProvider client={api}>
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const client = useFetch()
  const query = createQuery(() => ({
    queryKey: ['users'],
    queryFn: ({ signal }) => client.get<User[]>('/users', { signal }),
  }))

  if (query.isPending) return <p>Loading…</p>
  if (isFetchError(query.error)) return <p>{query.error.status}</p>
  return <ul>{query.data?.map((u) => <li>{u.name}</li>)}</ul>
}
```

## Bootstrap / wiring

SolidStart: use absolute URL + `ssr-forward` on the server like other SSR guides. See [tRPC · SolidStart](/guide/trpc#solid-start).

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
    <span class="blog-chart-label">Typed errors</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 22%">FetchError</div>
      <div class="blog-chart-bar is-http" style="--w: 65%">manual map</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Refresh token</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">plugin</div>
      <div class="blog-chart-bar is-http" style="--w: 85%">custom</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE accessors</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">useSse</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">EventSource DIY</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Share with React</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 18%">one createFetch</div>
      <div class="blog-chart-bar is-http" style="--w: 88%">fork clients</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">typical axios / fetch path</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | axios / fetch |
| --- | --- | --- |
| Solid Query fit | Native | Adapt |
| FetchProvider / useFetch | Yes | DIY |
| useSse accessors | Yes | DIY |
| Typed errors | `FetchError` | DIY |
| Refresh plugin | Yes | DIY |
| Path params | Yes | Manual |
| Bundle | ~4.8KB gzip | Varies |

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

```tsx
import { createMutation, useQueryClient } from '@tanstack/solid-query'
import { useFetch } from 'tanstack-fetch/solid'

const CreateUser = () => {
  const api = useFetch()
  const queryClient = useQueryClient()
  const mutation = createMutation(() => ({
    mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  }))
  return <button onClick={() => mutation.mutate({ name: 'Ada' })}>Create</button>
}
```

## Live data: SSE

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`.

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/solid'

const api = createFetch({ plugins: ['sse-resume'] })

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  if (status() === 'error') return <p>{error()?.message}</p>
  return (
    <div>
      <p>{status()}</p>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
      <button type="button" onClick={close}>Stop</button>
    </div>
  )
}
```

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
import { createQuery } from '@tanstack/solid-query'
import { api } from './api'
import type { AppRouter } from './server'

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

const posts = createQuery(() => ({
  queryKey: ['posts'],
  queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
}))
```

## Migrate

```bash
npx tanstack-fetch migrate --from axios --framework solid --write
npx tanstack-fetch doctor --dir ./src
```

## Suggested folder layout

```text
src/
  lib/api.ts
  app.tsx            # FetchProvider + QueryClientProvider
  queries/users.ts
  components/UsersPage.tsx
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → axios/fetch may stay</li>
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

- [ ] `FetchProvider` or shared api
- [ ] Forward `signal`
- [ ] `isFetchError` for status
- [ ] SSE accessors via `useSse`
- [ ] Doctor clean

## Try it

```bash
npm install tanstack-fetch solid-js @tanstack/solid-query
npx tanstack-fetch doctor --dir ./src
```

## Related

- [Solid guide](/guide/solid)
- [SSE · Solid](/guide/sse#solid)
- [tRPC · Solid](/guide/trpc#solid)
- [Migrate](/guide/migrate)

## Series

Same deep-dive format for every stack:

- [React](/blog/react-axios-tanstack-fetch)
- [Vue](/blog/vue-ofetch-tanstack-fetch)
- [Next.js](/blog/nextjs-fetch-tanstack-fetch)
- [Nuxt](/blog/nuxt-ofetch-tanstack-fetch)
- [TanStack Start / Router](/blog/tanstack-start-router-tanstack-fetch)
- [Svelte / SvelteKit](/blog/sveltekit-fetch-tanstack-fetch)
- [Angular](/blog/angular-http-client-tanstack-fetch)
