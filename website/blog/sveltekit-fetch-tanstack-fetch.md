---
title: 'Svelte / SvelteKit fetch vs tanstack-fetch: stores, SSR, Query'
titleTemplate: false
description: "Use tanstack-fetch with Svelte and SvelteKit — setFetchClient, useFetch, useSse stores, Svelte Query, ssr-forward load functions, and comparison graphs."
date: 2026-10-12
category: Framework guides
tags: ["Svelte","SSR"]
cover: /images/blog-sveltekit-fetch-tanstack-fetch-cover.jpg
---

# Svelte / SvelteKit fetch vs tanstack-fetch

<p class="blog-meta">October 12, 2026 · Svelte · SvelteKit · HTTP</p>

![Svelte / SvelteKit fetch vs tanstack-fetch: stores, SSR, Query](/images/blog-sveltekit-fetch-tanstack-fetch-cover.jpg)

::: tip Stack
**Svelte 4+ / SvelteKit** · `tanstack-fetch/svelte` · `@tanstack/svelte-query`
:::

SvelteKit’s `event.fetch` is perfect inside `load`. The browser still needs a typed client for Query, mutations, and SSE with Authorization.

**tanstack-fetch/svelte** uses `setFetchClient` in a layout, `useFetch` in components, and `useSse` stores (`$data`, `$status`). Kit SSR gets `ssr-forward` via the migrate scaffold’s `api.server.ts`.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| Browser Query + stores | **tanstack-fetch/svelte** |
| Kit `load` with cookies | `api.server.ts` + `ssr-forward` |
| SSE stores | `useSse` |
| `load`-only pages, no client cache | `event.fetch` is fine |
| Share client with React monorepo | same `createFetch` |

```bash
npm install tanstack-fetch svelte @tanstack/svelte-query
```

## Mental model

Split **server** (`+page.server.ts` / `api.server.ts`) from **browser** (`setFetchClient` in `+layout.svelte`). Do not open SSE in server load.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="g-svelte" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Component</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">Svelte stores</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Svelte Query</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">createQuery</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g-svelte)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">setFetchClient · useFetch</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">Layout setFetchClient · Kit api.server for load</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">event.fetch stays fine for simple load-only pages</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so `isError` works)
3. Cancel → pass Query’s `signal` through

## Side-by-side

### event.fetch only (glue when client needs cache)

```ts
// +page.server.ts
export const load = async ({ fetch }) => {
  const users = await fetch('/api/users').then((r) => r.json())
  return { users }
}
```

Hydrating into Svelte Query later means a second client and duplicated types.

### setFetchClient + Svelte Query

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { createFetch } from 'tanstack-fetch'
  import { createAuthInterceptor } from 'tanstack-fetch/plugins'
  import { setFetchClient } from 'tanstack-fetch/svelte'

  const api = createFetch({
    baseUrl: import.meta.env.VITE_API_URL,
    interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') })],
  })
  setFetchClient({ client: api })
</script>

<slot />
```

```svelte
<script lang="ts">
  import { useFetch } from 'tanstack-fetch/svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { isFetchError } from 'tanstack-fetch'

  const api = useFetch()
  const users = createQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })
</script>

{#if $users.isPending}
  <p>Loading…</p>
{:else if $users.isError}
  <p>{isFetchError($users.error) ? $users.error.status : 'Error'}</p>
{:else}
  <ul>
    {#each $users.data ?? [] as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{/if}
```

## Bootstrap / wiring

SvelteKit SSR scaffold:

```bash
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
```

Creates `src/lib/api.ts` (browser) and `src/lib/api.server.ts` (`ssr-forward` + cookies) for load functions.

## Comparison graph: where glue accumulates

Rough relative **boilerplate** (lower is better) — a map of where teams spend time, not a micro-benchmark.

<div class="blog-chart" role="img" aria-label="Boilerplate comparison chart">
  <div class="blog-chart-row">
    <span class="blog-chart-label">Browser Query fit</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 18%">tanstack-fetch</div>
      <div class="blog-chart-bar is-http" style="--w: 75%">rewrap event.fetch</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSR cookies in load</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 25%">api.server + ssr-forward</div>
      <div class="blog-chart-bar is-http" style="--w: 70%">manual headers</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE stores</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">useSse</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">EventSource DIY</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Typed errors</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 22%">FetchError</div>
      <div class="blog-chart-bar is-http" style="--w: 65%">res.ok checks</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Share with React</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 20%">one createFetch</div>
      <div class="blog-chart-bar is-http" style="--w: 88%">fork</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">typical event.fetch path</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | event.fetch / raw fetch |
| --- | --- | --- |
| setFetchClient / useFetch | Yes | DIY |
| useSse stores | Yes | DIY |
| Kit SSR helper | migrate `api.server` | Manual |
| Svelte Query fit | Native | Adapt |
| Typed errors | `FetchError` | DIY |
| Refresh plugin | Yes | DIY |
| SSE in `+page.server` | No — browser only | N/A |

## Auth, status handlers, refresh

```ts
import { createFetch } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createStatusInterceptor,
} from 'tanstack-fetch/plugins'

let expiresAt = 0

const api = createFetch({
  baseUrl: '/api',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({ 403: () => toast.error('Forbidden') }),
  ],
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
import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import { useFetch } from 'tanstack-fetch/svelte'

const api = useFetch()
const queryClient = useQueryClient()
const createUser = createMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
```

## Live data: SSE

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`.

```svelte
<script lang="ts">
  import { createFetch } from 'tanstack-fetch/sse'
  import { useSse } from 'tanstack-fetch/svelte'

  const api = createFetch({ plugins: ['sse-resume'] })
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
</script>

{#if $status === 'error'}
  <p>{$error?.message}</p>
{:else}
  <p>{$status}</p>
  <pre>{JSON.stringify($data, null, 2)}</pre>
  <button type="button" on:click={close}>Stop</button>
{/if}
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
import { createQuery } from '@tanstack/svelte-query'
import { api } from './api'
import type { AppRouter } from './server'

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

export const postsQuery = () =>
  createQuery({
    queryKey: ['posts'],
    queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
  })
```

## Migrate

```bash
npx tanstack-fetch migrate --from fetch --framework svelte --write
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
npx tanstack-fetch doctor --dir ./src
```

## Suggested folder layout

```text
src/
  lib/api.ts
  lib/api.server.ts     # Kit SSR
  routes/+layout.svelte # setFetchClient
  routes/+page.svelte
  lib/queries/users.ts
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → event.fetch may stay</li>
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

- [ ] `setFetchClient` in root layout
- [ ] Kit: `api.server.ts` for load cookies
- [ ] Forward `signal` in queryFns
- [ ] SSE only in browser components
- [ ] Doctor clean

## Try it

```bash
npm install tanstack-fetch svelte @tanstack/svelte-query
npx tanstack-fetch doctor --dir ./src
```

## Related

- [Svelte guide](/guide/svelte)
- [SSE · Svelte](/guide/sse#svelte)
- [tRPC · Svelte](/guide/trpc#svelte)
- [Migrate](/guide/migrate)

## Series

Same deep-dive format for every stack:

- [React](/blog/react-axios-tanstack-fetch)
- [Vue](/blog/vue-ofetch-tanstack-fetch)
- [Next.js](/blog/nextjs-fetch-tanstack-fetch)
- [Nuxt](/blog/nuxt-ofetch-tanstack-fetch)
- [Solid](/blog/solid-fetch-tanstack-fetch)
- [TanStack Start / Router](/blog/tanstack-start-router-tanstack-fetch)
- [Angular](/blog/angular-http-client-tanstack-fetch)
