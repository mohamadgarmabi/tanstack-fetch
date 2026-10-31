---
title: 'TanStack Start / Router + tanstack-fetch: Query on router context'
titleTemplate: false
description: "Wire tanstack-fetch into TanStack Start and TanStack Router — queryOptions, ensureQueryData loaders, router context, SSR, tRPC, and comparison graphs."
date: 2026-10-12
category: Framework guides
tags: ["TanStack Start","Router","React"]
cover: /images/blog-tanstack-start-router-tanstack-fetch-cover.jpg
---

# TanStack Start / Router + tanstack-fetch

<p class="blog-meta">October 12, 2026 · TanStack Start · Router · Query</p>

![TanStack Start / Router + tanstack-fetch: Query on router context](/images/blog-tanstack-start-router-tanstack-fetch-cover.jpg)

::: tip Stack
**TanStack Start** · `@tanstack/react-router` · `@tanstack/react-query` · `tanstack-fetch`
:::

TanStack Start shines when **Router + Query share context**: loaders call `ensureQueryData`, components call `useQuery` with the same `queryOptions`.

The missing piece is a fetch client that already speaks Query’s language. **tanstack-fetch** is that client — with `ssr-forward` on the server and the same options in the browser.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| Loaders + components share `queryOptions` | **tanstack-fetch** |
| Router context `queryClient` | Start / Router pattern |
| SSR cookies | `ssr-forward` |
| SPA-only Router | same pattern, no SSR plugin |
| tRPC on the same transport | `tanstack-fetch/trpc` |

```bash
npm install tanstack-fetch @tanstack/react-query @tanstack/react-router
```

## Mental model

Put `queryClient` on `createRouter({ context })`. Put HTTP in `createFetch`. Never fork “loader fetch” vs “component fetch”.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="g-start" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Route</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">loader · component</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Router ctx</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">queryClient</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g-start)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">createFetch · ssr</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">ensureQueryData → useQuery(same options)</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">Works for Start SSR and SPA Router</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so `isError` works)
3. Cancel → pass Query’s `signal` through

## Side-by-side

### ad-hoc loader fetch (glue)

```ts
export const Route = createFileRoute('/users')({
  loader: async () => {
    const res = await fetch('/api/users')
    return res.json()
  },
  component: ({ useLoaderData }) => {
    const data = useLoaderData()
    // separate from useQuery cache — duplicate requests later
  },
})
```

### queryOptions + ensureQueryData

```ts
// queries/users.ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '~/lib/api'

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

```ts
// router.tsx
import { createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient()
export const router = createRouter({
  routeTree,
  context: { queryClient },
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})
```

```ts
export const Route = createFileRoute('/users')({
  loader: ({ context }) => context.queryClient.ensureQueryData(usersQueryOptions),
  component: () => {
    const { data } = useQuery(usersQueryOptions)
    return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
  },
})
```

## Bootstrap / wiring

SSR `api` (Start):

```ts
import { createFetch } from 'tanstack-fetch'
import { createSsrForwardInterceptor } from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: process.env.SSR_ORIGIN ? `${process.env.SSR_ORIGIN}/api` : '/api',
  source: typeof window === 'undefined' ? 'ssr' : 'browser',
  interceptors: [createSsrForwardInterceptor()], // no-op in the browser
})
```

Nested routes: `userQueryOptions(params.userId)` in loader + `useQuery` in component. Prefetch in `beforeLoad` when you want waterfalls avoided.

## Comparison graph: where glue accumulates

Rough relative **boilerplate** (lower is better) — a map of where teams spend time, not a micro-benchmark.

<div class="blog-chart" role="img" aria-label="Boilerplate comparison chart">
  <div class="blog-chart-row">
    <span class="blog-chart-label">Shared cache loader↔UI</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 20%">queryOptions</div>
      <div class="blog-chart-bar is-http" style="--w: 80%">loader json only</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Typed HTTP</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 18%">tanstack-fetch</div>
      <div class="blog-chart-bar is-http" style="--w: 70%">raw fetch</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSR cookies</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 25%">ssr-forward</div>
      <div class="blog-chart-bar is-http" style="--w: 75%">manual headers</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">tRPC + Query</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">createTRPCFetch</div>
      <div class="blog-chart-bar is-http" style="--w: 90%">parallel stacks</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE live routes</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 30%">useSse</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">custom</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">loader-only fetch</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | ad-hoc loader fetch |
| --- | --- | --- |
| Router context Query | First-class | DIY |
| ensureQueryData | Native fit | N/A |
| Same options in component | Yes | Duplicate |
| SSR cookies | `ssr-forward` | Manual |
| Typed errors | `FetchError` | DIY |
| tRPC transport | Yes | DIY |
| SSE | `useSse` | DIY |

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

```tsx
const mutation = useMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
```

Invalidations stay on the same `queryClient` from router context.

## Live data: SSE

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`.

Use `useSse` in route components (browser). Loaders stay for initial REST/tRPC; streams are client-only.

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

Recommended Start pattern: [tRPC · TanStack Start](/guide/trpc#tanstack-start) with `createTRPCOptionsProxy` and router context.

## Migrate

```bash
npx tanstack-fetch migrate --from fetch --framework react --write
npx tanstack-fetch doctor --dir ./src
```

Move loader `fetch` calls into `queryOptions` + `ensureQueryData` incrementally.

## Suggested folder layout

```text
src/
  lib/api.ts
  queries/*.ts
  router.tsx          # context.queryClient
  routes/users.tsx    # loader + component
  routes/users.$id.tsx
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → loader-only fetch may stay</li>
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

- [ ] `queryClient` on router context
- [ ] Shared `queryOptions` modules
- [ ] Loaders use `ensureQueryData` / `prefetchQuery`
- [ ] `createFetch` with SSR branch
- [ ] Doctor clean

## Try it

```bash
npm install tanstack-fetch @tanstack/react-query @tanstack/react-router
npx tanstack-fetch doctor --dir ./src
```

## Related

- [TanStack Query guide](/guide/tanstack-query)
- [tRPC · Start](/guide/trpc#tanstack-start)
- [React deep dive](/blog/react-axios-tanstack-fetch)
- [SSR](/guide/ssr)

## Series

Same deep-dive format for every stack:

- [React](/blog/react-axios-tanstack-fetch)
- [Vue](/blog/vue-ofetch-tanstack-fetch)
- [Next.js](/blog/nextjs-fetch-tanstack-fetch)
- [Nuxt](/blog/nuxt-ofetch-tanstack-fetch)
- [Solid](/blog/solid-fetch-tanstack-fetch)
- [Svelte / SvelteKit](/blog/sveltekit-fetch-tanstack-fetch)
- [Angular](/blog/angular-http-client-tanstack-fetch)
