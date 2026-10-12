---
title: 'Next.js fetch vs tanstack-fetch: SSR cookies, Query hydrate, App Router'
titleTemplate: false
description: "Use tanstack-fetch in Next.js App Router — ssr-forward cookies, absolute baseUrl on the server, React Query dehydrate/hydrate, SSE, and migrate path."
---

# Next.js fetch vs tanstack-fetch

<p class="blog-meta">October 12, 2026 · Next.js · React · SSR</p>

::: tip Stack
**Next.js App Router** · `tanstack-fetch` · `@tanstack/react-query` · `ssr-forward`
:::

Next’s native `fetch` caches aggressively and does not give you a shared typed client across RSC, Route Handlers, and the browser. Cookie forwarding and Query hydration become one-off helpers.

**tanstack-fetch** + `ssr-forward` uses one `createFetch` on server and client: absolute `baseUrl` in SSR, relative in the browser, cookies from `next/headers`.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| Same client in RSC + browser | **tanstack-fetch** + `ssr-forward` |
| Prefetch + `HydrationBoundary` | **tanstack-fetch** + React Query |
| Cookie / auth header forward | `incoming` + `ssr-forward` |
| Simple static `fetch` in one RSC | native fetch is fine |
| SSE with Authorization | `tanstack-fetch/sse` |

```bash
npm install tanstack-fetch @tanstack/react-query
```

## Mental model

Server components need absolute URLs and request cookies. Client components need the same auth story after hydrate. One client with `source: 'ssr' | 'browser'` beats two fetch wrappers.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="g-next" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">RSC / Client</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">App Router</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">React Query</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">dehydrate · hydrate</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g-next)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">ssr-forward · createFetch</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">Server: cookies() → incoming · Client: same api module</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">Native fetch stays fine for one-off static reads</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so `isError` works)
3. Cancel → pass Query’s `signal` through

## Side-by-side

### native fetch + manual cookies (glue)

```ts
import { cookies } from 'next/headers'

export const getUsers = async () => {
  const jar = await cookies()
  const res = await fetch(`${process.env.API_URL}/users`, {
    headers: { cookie: jar.toString() },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<User[]>
}
```

You reimplement status errors, auth, and browser parity yourself.

### tanstack-fetch + ssr-forward

```ts
// lib/api.ts
import { createFetch } from 'tanstack-fetch'
import { cookies } from 'next/headers'

export const api = createFetch({
  baseUrl: process.env.API_URL, // absolute on server
  source: 'ssr',
  plugins: ['ssr-forward', 'trace', 'retry-idempotent'],
  incoming: async () => {
    const jar = await cookies()
    return { cookie: jar.toString() }
  },
})
```

```tsx
// app/users/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { usersQueryOptions } from '@/queries/users'
import { UsersClient } from './users-client'

export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(usersQueryOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient />
    </HydrationBoundary>
  )
}
```

## Bootstrap / wiring

Browser bundle can import a second client (`source: 'browser'`, relative `baseUrl`) or the same factory that branches on `typeof window`. `ssr-forward` **no-ops on the client**.

Example: [Next.js SSR](/examples/next-ssr)

## Comparison graph: where glue accumulates

Rough relative **boilerplate** (lower is better) — a map of where teams spend time, not a micro-benchmark.

<div class="blog-chart" role="img" aria-label="Boilerplate comparison chart">
  <div class="blog-chart-row">
    <span class="blog-chart-label">Cookie forward SSR</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 22%">ssr-forward</div>
      <div class="blog-chart-bar is-http" style="--w: 75%">manual cookies()</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Query hydrate</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 25%">shared queryOptions</div>
      <div class="blog-chart-bar is-http" style="--w: 70%">ad-hoc RSC fetch</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Typed errors</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 20%">FetchError</div>
      <div class="blog-chart-bar is-http" style="--w: 65%">res.ok checks</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Auth refresh</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">plugin</div>
      <div class="blog-chart-bar is-http" style="--w: 85%">route handler DIY</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE + Authorization</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 30%">useSse</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">EventSource</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">typical Next fetch helpers</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | native fetch helpers |
| --- | --- | --- |
| SSR cookie forward | `ssr-forward` | Manual |
| Absolute server baseUrl | Built-in pattern | Manual |
| Query dehydrate/hydrate | Native fit | Glue |
| Typed errors | `FetchError` | DIY |
| Refresh token | Plugin | DIY |
| RSC + client same options | `queryOptions` | Duplicate |
| SSE + Authorization | Yes | Hard |

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
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFetch } from 'tanstack-fetch'

const browserApi = createFetch({ baseUrl: '/api', source: 'browser' })

export const CreateUserButton = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) => browserApi.post<User>('/users', { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  return <button onClick={() => mutation.mutate({ name: 'Ada' })}>Create</button>
}
```

## Live data: SSE

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`.

Keep SSE in **client** components with `tanstack-fetch/sse` + `useSse` from `tanstack-fetch/react`. Do not open EventSource in RSC.

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

Relative `/api/trpc` in the browser, absolute origin on the server. Wire `createTRPCFetch(api)` so cookies and refresh apply. See [tRPC · Next.js](/guide/trpc#nextjs).

## Migrate

```bash
npx tanstack-fetch migrate --from fetch --framework next --write
npx tanstack-fetch doctor --dir ./src
```

1. Server `api` with `ssr-forward` + `cookies()`
2. Shared `queryOptions`
3. Prefetch in RSC + `HydrationBoundary`
4. Client mutations on browser api
5. Remove one-off `fetch` wrappers

## Suggested folder layout

```text
src/
  lib/api.ts              # SSR createFetch
  lib/api.browser.ts      # optional browser client
  queries/users.ts
  app/users/page.tsx      # prefetch + HydrationBoundary
  app/users/users-client.tsx
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → native fetch may stay</li>
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

- [ ] Absolute `API_URL` on server
- [ ] `ssr-forward` + `incoming` from `cookies()`
- [ ] Shared `queryOptions` for RSC + client
- [ ] Forward `signal` in queryFns
- [ ] SSE only in client components
- [ ] Doctor clean

## Try it

```bash
npm install tanstack-fetch @tanstack/react-query
npx tanstack-fetch doctor --dir ./src
```

## Related

- [SSR · Next.js](/guide/ssr#nextjs)
- [React guide](/guide/react)
- [Next SSR example](/examples/next-ssr)
- [React deep dive](/blog/react-axios-tanstack-fetch)

## Series

Same deep-dive format for every stack:

- [React](/blog/react-axios-tanstack-fetch)
- [Vue](/blog/vue-ofetch-tanstack-fetch)
- [Nuxt](/blog/nuxt-ofetch-tanstack-fetch)
- [Solid](/blog/solid-fetch-tanstack-fetch)
- [TanStack Start / Router](/blog/tanstack-start-router-tanstack-fetch)
- [Svelte / SvelteKit](/blog/sveltekit-fetch-tanstack-fetch)
- [Angular](/blog/angular-http-client-tanstack-fetch)
