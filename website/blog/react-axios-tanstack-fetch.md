---
title: 'React axios vs tanstack-fetch: typed fetch for TanStack Query'
titleTemplate: false
description: "Replace axios unwrap glue with tanstack-fetch — FetchProvider, useFetch, useSse, React Query, refresh-token, migrate CLI, and a full side-by-side comparison."
date: 2026-10-12
category: Framework guides
tags: ["React","Comparison"]
cover: /images/blog-react-axios-tanstack-fetch-cover.jpg
---

# React axios vs tanstack-fetch

<p class="blog-meta">October 12, 2026 · React · TanStack Query · HTTP</p>

![React axios vs tanstack-fetch: typed fetch for TanStack Query](/images/blog-react-axios-tanstack-fetch-cover.jpg)

::: tip Stack
**React 18+** · `tanstack-fetch/react` · `@tanstack/react-query`
:::

axios is great at interceptors. It is **not** shaped for TanStack Query’s `queryFn` contract: return data, throw on failure, honor `AbortSignal`.

That gap shows up as `.data` unwraps, custom error mappers, and refresh-token races. **tanstack-fetch** closes it with the same client every other stack uses — via `FetchProvider` / `useFetch` when you want context.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| Drop into `useQuery` / `useMutation` | **tanstack-fetch** |
| Typed `FetchError` with status + body | **tanstack-fetch** |
| SSE with `Authorization` + resume | **tanstack-fetch/sse** + `useSse` |
| Huge axios interceptor stack, no Query | axios can stay |
| Share one client with Vue/Solid/Angular | **tanstack-fetch** |

```bash
npm install tanstack-fetch @tanstack/react-query
```

## Mental model

axios returns `AxiosResponse`. TanStack Query wants the **body** and a thrown error. Bridging is possible — and noisy.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="g-react" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Component</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">hooks · JSX</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">React Query</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">useQuery · cache</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g-react)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">useFetch() · createFetch</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">React context: FetchProvider → useFetch (optional for SSE)</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">axios stays optional while migrating modules</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so `isError` works)
3. Cancel → pass Query’s `signal` through

## Side-by-side

### axios + Query (glue)

```tsx
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

const UsersPage = () => {
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: async ({ signal }) => {
      const response = await axios.get<User[]>('/users', { signal })
      return response.data // easy to forget
    },
  })
  // map AxiosError → UI yourself
}
```

### tanstack-fetch + Query (native)

```tsx
import { FetchProvider, useFetch } from 'tanstack-fetch/react'
import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'

const App = () => (
  <FetchProvider
    baseUrl={import.meta.env.VITE_API_URL}
    getToken={() => localStorage.getItem('access_token')}
  >
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const api = useFetch()
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error)) return <p>{error.status}: {error.message}</p>
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
}
```

## Bootstrap / wiring

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FetchProvider } from 'tanstack-fetch/react'
import { createFetch } from 'tanstack-fetch'
import { createAuthInterceptor } from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') })],
})

const queryClient = new QueryClient()

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <FetchProvider client={api}>
      <Routes />
    </FetchProvider>
  </QueryClientProvider>
)
```

Or skip the provider and import a module-level `api` into every `queryFn` — `FetchProvider` is optional.

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
      <div class="blog-chart-bar is-http" style="--w: 65%">AxiosError map</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">401 refresh + retry</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">refresh-token plugin</div>
      <div class="blog-chart-bar is-http" style="--w: 88%">interceptor queue</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE + Authorization</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 30%">useSse</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">EventSource / custom</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Shared with Vue/Solid</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 20%">one createFetch</div>
      <div class="blog-chart-bar is-http" style="--w: 88%">rewrite per stack</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">typical axios path</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | axios |
| --- | --- | --- |
| Returns body for Query `queryFn` | Yes | Adapt (`.data`) |
| Throws typed error with status/body | `FetchError` | Partial |
| Native `AbortSignal` | First-class | Yes (adapt) |
| Status handlers `401`–`429` | `createStatusInterceptor` | Custom |
| Refresh token single-flight | Plugin | Custom |
| Path params typing `:id` | Yes | Manual |
| Upload + progress | `api.upload()` (`tanstack-fetch/sse`) | Yes |
| SSE + `Authorization` | `tanstack-fetch/sse` | No |
| tRPC transport | `tanstack-fetch/trpc` | DIY |
| Bundle (HTTP core) | 3.57KB gzip | Larger |

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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useFetch } from 'tanstack-fetch/react'

const CreateUser = () => {
  const api = useFetch()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  return <button onClick={() => mutation.mutate({ name: 'Ada' })}>Create</button>
}
```

## Live data: SSE

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`.

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  if (status === 'error') return <p>{error?.message}</p>
  return (
    <div>
      <p>{status}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button type="button" onClick={close}>Stop</button>
    </div>
  )
}
```

**FetchProvider is not required** for SSE — pass `{ client }`.

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

```tsx
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { useQuery, QueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { api } from './api'
import type { AppRouter } from './server'

const queryClient = new QueryClient()
const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})
const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient })

useQuery(trpc.post.list.queryOptions())
```

## Migrate

```bash
npx tanstack-fetch migrate --from axios --framework react --write
npx tanstack-fetch doctor --dir ./src
```

1. One `createFetch` (+ optional `FetchProvider`)
2. Port `useQuery` reads first
3. Port mutations
4. Swap custom 401 refresh for the plugin
5. Delete axios when call sites are gone

## Suggested folder layout

```text
src/
  lib/api.ts
  queries/users.ts
  components/UsersPage.tsx
  components/OrdersLive.tsx
  App.tsx          # QueryClientProvider + FetchProvider
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → axios may stay</li>
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

- [ ] Optional `FetchProvider` or shared `api` module
- [ ] Every `queryFn` / `mutationFn` forwards `{ signal }`
- [ ] Errors via `isFetchError` when you need `status`
- [ ] Refresh via plugin
- [ ] SSE from `tanstack-fetch/sse` when auth matters
- [ ] `npx tanstack-fetch doctor --dir ./src` clean

## Try it

```bash
npm install tanstack-fetch @tanstack/react-query
npx tanstack-fetch doctor --dir ./src
```

## Related

- [React guide](/guide/react)
- [SSE · React](/guide/sse#react)
- [tRPC · React](/guide/trpc#react)
- [Migrate CLI](/guide/migrate)
- [Comparison](/guide/comparison)

## Series

Same deep-dive format for every stack:

- [Vue](/blog/vue-ofetch-tanstack-fetch)
- [Next.js](/blog/nextjs-fetch-tanstack-fetch)
- [Nuxt](/blog/nuxt-ofetch-tanstack-fetch)
- [Solid](/blog/solid-fetch-tanstack-fetch)
- [TanStack Start / Router](/blog/tanstack-start-router-tanstack-fetch)
- [Svelte / SvelteKit](/blog/sveltekit-fetch-tanstack-fetch)
- [Angular](/blog/angular-http-client-tanstack-fetch)
