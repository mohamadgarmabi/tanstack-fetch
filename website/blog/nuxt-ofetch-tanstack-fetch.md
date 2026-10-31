---
title: 'Nuxt $fetch / ofetch vs tanstack-fetch: SSR cookies and Vue Query'
titleTemplate: false
description: "Replace Nuxt $fetch glue with tanstack-fetch — createFetchPlugin, ssr-forward, useFetchClient naming, Vue Query hydrate, SSE, and comparison graphs."
date: 2026-10-12
category: Framework guides
tags: ["Nuxt","Vue","SSR"]
cover: /images/blog-nuxt-ofetch-tanstack-fetch-cover.jpg
---

# Nuxt $fetch vs tanstack-fetch

<p class="blog-meta">October 12, 2026 · Nuxt · Vue · SSR</p>

![Nuxt $fetch / ofetch vs tanstack-fetch: SSR cookies and Vue Query](/images/blog-nuxt-ofetch-tanstack-fetch-cover.jpg)

::: tip Stack
**Nuxt 3 / 4** · `tanstack-fetch/vue` · `@tanstack/vue-query` · `ssr-forward`
:::

Nuxt’s `$fetch` (ofetch) is ergonomic for Nitro and pages. It still leaves you to invent Query-ready errors, AbortSignal discipline, SSE with Authorization, and a browser-identical client after SSR.

**tanstack-fetch** plugs into Nuxt via `createFetchPlugin`, forwards cookies with `ssr-forward`, and shares options with Vue Query.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| SSR cookies + same client in browser | **tanstack-fetch** |
| Vue Query without `$fetch` unwrap glue | **tanstack-fetch** |
| Name clash with Nuxt `useFetch` | import as `useFetchClient` |
| One-off Nitro utility | `$fetch` is fine |
| SSE + Authorization | `useSse` |

```bash
npm install tanstack-fetch @tanstack/vue-query
```

## Mental model

On the server, read `useRequestHeaders(['cookie', …])`. On the client, `ssr-forward` skips. One plugin registration covers both.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="g-nuxt" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Page / SFC</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">Vue / Nuxt</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Vue Query</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">useQuery · hydrate</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g-nuxt)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">plugin · ssr-forward</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">Nuxt plugin: createFetchPlugin + provide $api</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">$fetch stays fine for Nitro-only utilities</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so `isError` works)
3. Cancel → pass Query’s `signal` through

## Side-by-side

### $fetch in a page (glue for Query)

```vue
<script setup lang="ts">
const { data } = await useAsyncData('users', () => $fetch<User[]>('/api/users'))
</script>
```

Great for simple pages — weaker when you need shared cache, mutations, refresh-token, and SSE with the same auth.

### tanstack-fetch Nuxt plugin

```ts
// plugins/tanstack-fetch.ts
import { createFetch } from 'tanstack-fetch'
import {
  createRetryIdempotentInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const api = createFetch({
    baseUrl: config.public.apiBase as string,
    source: import.meta.server ? 'ssr' : 'client',
    interceptors: [
      createSsrForwardInterceptor(),
      createTraceInterceptor(),
      createRetryIdempotentInterceptor(),
    ],
    incoming: () => {
      if (!import.meta.server) return undefined
      const headers = useRequestHeaders(['cookie', 'authorization', 'x-request-id'])
      return {
        cookie: headers.cookie,
        authorization: headers.authorization,
        requestId: headers['x-request-id'],
      }
    },
  })
  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
  return { provide: { api } }
})
```

```vue
<script setup lang="ts">
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'
import { useQuery } from '@tanstack/vue-query'

const api = useFetchClient()
// or: const { $api } = useNuxtApp()

const { data, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
</script>
```

## Bootstrap / wiring

Example: [Nuxt SSR](/examples/nuxt-ssr). Pair with a Vue Query Nuxt plugin for dehydrate/hydrate.

## Comparison graph: where glue accumulates

Rough relative **boilerplate** (lower is better) — a map of where teams spend time, not a micro-benchmark.

<div class="blog-chart" role="img" aria-label="Boilerplate comparison chart">
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSR cookie forward</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 22%">ssr-forward</div>
      <div class="blog-chart-bar is-http" style="--w: 72%">manual headers</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Query-ready GET</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 18%">tanstack-fetch</div>
      <div class="blog-chart-bar is-http" style="--w: 68%">$fetch + map</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Refresh token</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">plugin</div>
      <div class="blog-chart-bar is-http" style="--w: 85%">server middleware DIY</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE + Authorization</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 30%">useSse</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">EventSource</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Share with Vue SPA</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 20%">same plugin API</div>
      <div class="blog-chart-bar is-http" style="--w: 80%">fork clients</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">typical $fetch path</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | $fetch / ofetch |
| --- | --- | --- |
| SSR cookie forward | `ssr-forward` | Manual |
| Vue Query fit | Native | Adapt |
| Name-safe composable | `useFetchClient` | Nuxt `useFetch` |
| Typed errors | `FetchError` | ofetch errors |
| Refresh single-flight | Plugin | DIY |
| SSE + Authorization | Yes | No |
| Nitro-only calls | Use either | Native `$fetch` |

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
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'

const api = useFetchClient()
const queryClient = useQueryClient()
useMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
```

## Live data: SSE

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`.

Create the stream client from `tanstack-fetch/sse` (often in the same Nuxt plugin with `sse-resume`) and call `useSse` in a client-only component.

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

Use `createTRPCFetch(api)` so Nuxt SSR cookies apply to tRPC batches. See [tRPC · Vue/Nuxt](/guide/trpc#vue).

## Migrate

```bash
npx tanstack-fetch migrate --from ofetch --framework nuxt --write
npx tanstack-fetch doctor --dir ./
```

## Suggested folder layout

```text
plugins/tanstack-fetch.ts
plugins/vue-query.ts
queries/users.ts
pages/users.vue
components/OrdersLive.client.vue
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → $fetch may stay</li>
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

- [ ] Nuxt plugin with `ssr-forward` + `incoming`
- [ ] Import `useFetch` as `useFetchClient` if needed
- [ ] Forward `signal` in queryFns
- [ ] SSE in client components
- [ ] Doctor clean

## Try it

```bash
npm install tanstack-fetch @tanstack/vue-query
npx tanstack-fetch doctor --dir ./src
```

## Related

- [SSR · Nuxt](/guide/ssr#nuxt)
- [Vue & Nuxt guide](/guide/vue)
- [Nuxt SSR example](/examples/nuxt-ssr)
- [Vue deep dive](/blog/vue-ofetch-tanstack-fetch)

## Series

Same deep-dive format for every stack:

- [React](/blog/react-axios-tanstack-fetch)
- [Vue](/blog/vue-ofetch-tanstack-fetch)
- [Next.js](/blog/nextjs-fetch-tanstack-fetch)
- [Solid](/blog/solid-fetch-tanstack-fetch)
- [TanStack Start / Router](/blog/tanstack-start-router-tanstack-fetch)
- [Svelte / SvelteKit](/blog/sveltekit-fetch-tanstack-fetch)
- [Angular](/blog/angular-http-client-tanstack-fetch)
