---
name: tanstack-fetch
description: >-
  Build and wire tanstack-fetch v1.5 (typed Fetch client for TanStack Query): createFetch,
  path params, FetchError, status handlers, plugins, SSR, SSE, upload, DevTools, React hooks,
  Vue/Nuxt composables (createFetchPlugin, useFetch, useSse), and tRPC. Use when adding or
  changing HTTP clients, queryFn, axios alternatives, SSE streams, Vue, Nuxt, or when the
  user mentions tanstack-fetch.
license: MIT
metadata:
  author: Mohammad Garmabi
  package: tanstack-fetch
  version: '1.6.1'
  docs: https://mohamadgarmabi.github.io/tanstack-fetch/
  npm: https://www.npmjs.com/package/tanstack-fetch
  llm: https://mohamadgarmabi.github.io/tanstack-fetch/llms.txt
---

# tanstack-fetch (v1.6.1)

Typed Fetch client shaped for TanStack Query. Not an official TanStack package.

Docs: https://mohamadgarmabi.github.io/tanstack-fetch/  
LLM context: https://mohamadgarmabi.github.io/tanstack-fetch/llms.txt  
npm: `tanstack-fetch`

## Mental model (always)

1. **Return data** on success
2. **Throw `FetchError`** on HTTP failure (default)
3. **Honor `AbortSignal`** — pass Query’s `signal`

Never wrap responses as `{ data }` like axios. Prefer one shared `api` module.

## Install

```bash
# React + Query
npm install tanstack-fetch @tanstack/react-query

# Vue / Nuxt (vue is optional peer >=3.3)
npm install tanstack-fetch vue
```

## Entry points (gzip, minified ESM)

| Import                    | Use when                                       | gzip   |
| ------------------------- | ---------------------------------------------- | ------ |
| `tanstack-fetch`          | HTTP only (`get` / `post` / `upload` / …)      | 4.81KB |
| `tanstack-fetch/sse`      | Need `api.sse()` (fetch-based streams + auth)  | 5.94KB |
| `tanstack-fetch/plugins`  | Factories (`createRefreshTokenInterceptor`, …) | 1.13KB |
| `tanstack-fetch/react`    | `FetchProvider`, `useFetch`, `useSse`          | 0.81KB |
| `tanstack-fetch/vue`      | `createFetchPlugin`, `useFetch`, `useSse`      | 0.78KB |
| `tanstack-fetch/trpc`     | tRPC link via the same client                  | 3.16KB |
| `tanstack-fetch/devtools` | `setupDevtools(api)` request dock              | 8.32KB |

```ts
import { createFetch } from 'tanstack-fetch' // HTTP
import { createFetch } from 'tanstack-fetch/sse' // + SSE
```

## Shared client (default pattern)

```ts
// src/lib/api.ts
import { createFetch, isFetchError, parseRetryAfter } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
  onTooManyRequests: ({ context }) => {
    const waitMs = parseRetryAfter(context.response?.headers, 1000)
    console.warn('rate limited', waitMs)
  },
  plugins: ['trace', 'retry-idempotent'],
})
```

## Path params (typed)

`:id` / `{id}` segments require `params`. TypeScript enforces keys from the path literal.

```ts
await api.get('/users/:id', { params: { id } })
await api.get<User>()('/users/:id', { params: { id } })
await api.get<User[]>()('/users', { query: { page: 1 } })
```

## TanStack Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>()('/users', { signal }),
})

useMutation({
  mutationFn: (body: CreateUser) => api.post<User>()('/users', { body }),
})
```

## Errors

```ts
import { isFetchError } from 'tanstack-fetch'

try {
  await api.get('/missing')
} catch (error) {
  if (isFetchError(error)) {
    // error.status, error.code, error.body, error.message
  }
}
```

## React

```ts
import { FetchProvider, useFetch, useSse } from 'tanstack-fetch/react'
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({ plugins: ['sse-resume'] })

// tree
;<FetchProvider client={api}>{children}</FetchProvider>

const client = useFetch() // injects shared client — does NOT fetch data
const { data, status, close } = useSse<OrderEvent>('/orders/stream', { client: api })
// status: 'connecting' | 'connected' | 'disconnected' | 'error'
```

Prefer `useSse({ client: api })` — `FetchProvider` is optional when `client` is passed.

## Vue / Nuxt (1.5.0)

`useFetch` from this package **injects the shared client** — it does not run an HTTP request. In Nuxt, rename to avoid clashing with core `useFetch`:

```ts
import { useFetch as useFetchClient, useSse, createFetchPlugin } from 'tanstack-fetch/vue'
```

### Vue app

```ts
import { createApp } from 'vue'
import { createFetch } from 'tanstack-fetch'
import { createFetchPlugin, useFetch } from 'tanstack-fetch/vue'

const api = createFetch({ baseUrl: import.meta.env.VITE_API_URL })
createApp(App).use(createFetchPlugin({ client: api })).mount('#app')

// in a component
const api = useFetch()
await api.get<User[]>()('/users')
```

`provideFetchClient(api)` only works in a **parent** setup for child `useFetch` (same-component provide+inject does not work in Vue). Prefer the plugin for app-wide / Nuxt setup.

### Nuxt plugin

```ts
// plugins/tanstack-fetch.ts
import { createFetch } from 'tanstack-fetch/sse'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const api = createFetch({
    baseUrl: useRuntimeConfig().public.apiBase,
    plugins: ['sse-resume', 'ssr-forward'],
    getToken: () => useCookie('access_token').value,
  })
  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
  return { provide: { api } }
})
```

### Vue `useSse` (plugin optional)

```ts
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

const api = createFetch({ plugins: ['sse-resume'] })
const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
  client: api,
})
// status Ref: 'connecting' | 'connected' | 'disconnected' | 'error'
```

## SSE (core)

Import from `tanstack-fetch/sse`. Prefer handlers → `{ close }`. Or omit handlers and `for await`.

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => console.log(data),
  onError: (error) => console.error(error),
})
stream.close()
```

## SSR

Use absolute `baseUrl`. Forward cookies with `ssr-forward` (Next.js `cookies()` / Nuxt `useRequestHeaders`).

```ts
import { createFetch } from 'tanstack-fetch'
import { cookies } from 'next/headers'

const api = createFetch({
  baseUrl: process.env.API_URL,
  plugins: ['ssr-forward'],
  incoming: async () => {
    const jar = await cookies()
    return { cookie: jar.toString() }
  },
})
```

## Upload

```ts
await api.upload('/files', {
  body: { file },
  onUploadProgress: ({ progress }) => console.log(progress),
})
```

## Plugins & refresh token

Named plugins on `createFetch({ plugins })`: `trace` · `ssr-forward` · `retry-idempotent` · `sse-resume`.

```ts
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{ accessToken: string }>()('/auth/refresh', {
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      /* store body.accessToken */
    },
    before: { getExpiresAt: () => expiresAt, skewMs: 60_000 },
    after: { enabled: true },
  }),
)
```

## DevTools

```ts
import { setupDevtools } from 'tanstack-fetch/devtools'

setupDevtools(api) // toggle: Alt+Shift+F (macOS ⌥⇧F)
// options: { http, sse, ssr, trpc, open }
```

## tRPC

```ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'

const api = createFetch({ getToken: () => token })
const trpcClient = createTRPCFetchClient<AppRouter>({ url: '/api/trpc', client: api })
```

## Do / don’t

| Do                                    | Don’t                                      |
| ------------------------------------- | ------------------------------------------ |
| One shared `api`                      | New `createFetch()` per call site          |
| Pass `{ signal }` from Query          | Ignore abort                               |
| `isFetchError` for branches           | Catch and swallow blindly                  |
| `tanstack-fetch/sse` for auth streams | Browser `EventSource` when you need Bearer |
| `params` for `:id` paths              | String-concat URLs                         |
| Alias Vue `useFetch` in Nuxt          | Clash with Nuxt core `useFetch`            |
| `useSse({ client })` without provider | Assume `useFetch` performs HTTP            |

## More detail

- Entry points & sizes: [references/entry-points.md](references/entry-points.md)
- Status handlers map: [references/status-handlers.md](references/status-handlers.md)
- Vue guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/vue
- Changelog 1.6.1: https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-6
