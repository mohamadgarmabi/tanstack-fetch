---
name: tanstack-fetch
description: >-
  Build and wire tanstack-fetch v2 (typed Fetch client for TanStack Query): createFetch,
  path params, FetchError, status handlers, plugins, SSR, SSE, WebSocket, WebTransport, NDJSON
  streams, upload, DevTools, React hooks, Vue/Nuxt composables (createFetchPlugin, useFetch,
  useSse, useWs), and tRPC. Use when adding or changing HTTP clients, queryFn, axios
  alternatives, SSE / WebSocket / streaming, Vue, Nuxt, or when the user mentions tanstack-fetch.
license: MIT
metadata:
  author: Mohammad Garmabi
  package: tanstack-fetch
  version: '2.0.0'
  docs: https://mohamadgarmabi.github.io/tanstack-fetch/
  npm: https://www.npmjs.com/package/tanstack-fetch
  llm: https://mohamadgarmabi.github.io/tanstack-fetch/llms.txt
---

# tanstack-fetch (v2.0.0)

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

| Import                    | Use when                                               | gzip   |
| ------------------------- | ------------------------------------------------------ | ------ |
| `tanstack-fetch`          | Slim HTTP; features via `interceptors` (no `upload`)   | 3.57KB |
| `tanstack-fetch/sse`      | Full HTTP (shortcuts, `upload`) + `api.sse()`          | 6.33KB |
| `tanstack-fetch/live`     | `sse` + `ws` + `transport` + `stream`                  | 8.75KB |
| `tanstack-fetch/plugins`  | Factories (`createRefreshTokenInterceptor`, …)         | 1.13KB |
| `tanstack-fetch/react`    | `FetchProvider`, `useFetch`, `useSse`, `useWs`         | 0.99KB |
| `tanstack-fetch/vue`      | `createFetchPlugin`, `useFetch`, `useSse`, `useWs`     | 0.94KB |
| `tanstack-fetch/solid`    | `FetchProvider`, `useFetch`, `useSse`, `useWs`         | —      |
| `tanstack-fetch/svelte`   | `setFetchClient`, `useFetch`, `useSse`, `useWs`        | —      |
| `tanstack-fetch/angular`  | `provideFetchClient`, `injectFetch`, `useSse`, `useWs` | —      |
| `tanstack-fetch/trpc`     | tRPC link via the same client                          | 3.28KB |
| `tanstack-fetch/devtools` | `setupDevtools(api)` request dock                      | 8.70KB |

```ts
import { createFetch } from 'tanstack-fetch' // slim HTTP: interceptors only
import { createFetch } from 'tanstack-fetch/sse' // + SSE
import { createFetch } from 'tanstack-fetch/live' // + SSE, WebSocket, WebTransport, NDJSON
```

Core `createFetch` takes only `baseUrl`, `headers`, `source`, `incoming`, `timeoutMs`, `interceptors`, `fetch`, `credentials`, `maxRetries`. Option shortcuts (`getToken`, `auth`, `plugins: [...]`, `onUnauthorized`, `onStatus`, …), `upload()` and progress events exist only on `/sse`, `/live`, `/trpc` and the framework providers.

## Shared client (default pattern)

```ts
// src/lib/api.ts
import { createFetch, isFetchError, parseRetryAfter } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({
      401: () => {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      },
      429: ({ context }) => {
        const waitMs = parseRetryAfter(context.response?.headers, 1000)
        console.warn('rate limited', waitMs)
      },
    }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})
```

## Path params (typed)

`:id` / `{id}` segments require `params`. TypeScript enforces keys from the path literal.

```ts
await api.get('/users/:id', { params: { id } })
await api.get<User, { id: string | number }>('/users/:id', { params: { id } })
await api.post<User, NoParams, CreateUser>('/users', { body })
await api.get<User[]>('/users', { query: { page: 1 } })
```

## TanStack Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

useMutation({
  mutationFn: (body: CreateUser) => api.post<User, NoParams, CreateUser>('/users', { body }),
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
createApp(App)
  .use(createFetchPlugin({ client: api }))
  .mount('#app')

// in a component
const api = useFetch()
await api.get<User[]>('/users', {})
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

## WebSocket, WebTransport, NDJSON (1.8.0)

Import from `tanstack-fetch/live`. Same `getToken` / `auth` / plugins / interceptors as HTTP.

```ts
import { createFetch } from 'tanstack-fetch/live'

const api = createFetch({ baseUrl: 'https://api.example.com', getToken: () => auth.token })

// WebSocket — returns { send, close, getSocket }; https → wss
const room = api.ws<ChatMessage, { id: string }, OutgoingMessage>('/rooms/:id', {
  params: { id },
  authIn: 'query', // REQUIRED in browsers when a token exists ('query' | 'protocol')
  onMessage: (message) => render(message), // JSON frames parsed
  reconnect: { retries: 5, delayMs: 1000 }, // default; false disables
})
room.send({ text: 'hi' }) // queued until open; ignored after close

// WebTransport (HTTP/3 datagrams, may drop / reorder) — same API
const game = api.transport<GameState, { id: string }, Input>('/game/:id', {
  params: { id },
  authIn: 'query',
})

// NDJSON over fetch (any method + body + headers) — AsyncIterable
for await (const chunk of api.stream<Token>('/chat', { body: { prompt }, signal })) {
  answer += chunk.text
}
```

Rules:

- Browsers / workers cannot send WebSocket headers: set `authIn`, otherwise `onError` fires and nothing is sent. Node 22+ / Bun / Deno default to an `Authorization` header.
- Node < 22: `createFetch({ createWebSocket: (url, { protocols, headers }) => new WS(url, protocols, { headers }) })` with the `ws` package.
- The token is fetched again on every reconnect; `onClose` fires exactly once.
- `api.stream` runs the full interceptor pipeline (status handlers, `refresh-token` on 401, retry); `timeoutMs` covers headers only. Use it with TanStack Query `experimental_streamedQuery({ streamFn: ({ signal }) => api.stream(…, { signal }) })`.
- Hooks: `useWs(path, { client: api, authIn, transport? })` in react / vue / solid / svelte / angular → `{ data, status, error, send, close }`.
- Path params are typed like `api.get`: inferred from the URL without generics, or pass them — `ws` / `transport` / `useWs<Message, Params, Send>`, `sse` / `stream` / `useSse<Message, Params>` (`NoParams` to skip). With only `<Message>` TypeScript loses the path literal, so add `Params` to keep `params` checked.
- Interceptor hooks: `onLiveOpen`, `onLiveMessage` (`context.message.direction` `'in' | 'out'`), `onLiveClose` (`context.error` on abnormal end); `context.meta.transport` is `'websocket' | 'webtransport' | 'ndjson'`.

## SSR

Use absolute `baseUrl`. Forward cookies with `ssr-forward` (Next.js `cookies()` / Nuxt `useRequestHeaders`).

```ts
import { createFetch } from 'tanstack-fetch'
import { createSsrForwardInterceptor } from 'tanstack-fetch/plugins'
import { cookies } from 'next/headers'

const api = createFetch({
  baseUrl: process.env.API_URL,
  interceptors: [createSsrForwardInterceptor()],
  incoming: async () => {
    const jar = await cookies()
    return { cookie: jar.toString() }
  },
})
```

## Upload

Needs the full client: `import { createFetch } from 'tanstack-fetch/sse'` (core has no `upload()` / progress).

```ts
await api.upload('/files', {
  body: { file },
  onUploadProgress: ({ progress }) => console.log(progress),
})

await api.get('/files/report.pdf', {
  parseAs: 'blob',
  onDownloadProgress: ({ progress, loaded, total }) => console.log(progress, loaded, total),
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
      const body = await api.post<{ accessToken: string }>('/auth/refresh', {
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
// options: { http, sse, ssr, trpc, ws, stream, open }
// WS tab: api.ws / api.transport (messages in / out) · Stream tab: api.stream lines
```

## tRPC

```ts
import { createFetch } from 'tanstack-fetch'
import { createAuthInterceptor } from 'tanstack-fetch/plugins'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'

const api = createFetch({ interceptors: [createAuthInterceptor({ getToken: () => token })] })
const trpcClient = createTRPCFetchClient<AppRouter>({ url: '/api/trpc', client: api })
```

## Do / don’t

| Do                                     | Don’t                                      |
| -------------------------------------- | ------------------------------------------ |
| One shared `api`                       | New `createFetch()` per call site          |
| Pass `{ signal }` from Query           | Ignore abort                               |
| `isFetchError` for branches            | Catch and swallow blindly                  |
| `tanstack-fetch/sse` for auth streams  | Browser `EventSource` when you need Bearer |
| `api.ws` + explicit `authIn` (browser) | Raw `new WebSocket()` + token glue         |
| `api.stream` + `streamedQuery`         | Hand-parse NDJSON with `fetch` readers     |
| `params` for `:id` paths               | String-concat URLs                         |
| Alias Vue `useFetch` in Nuxt           | Clash with Nuxt core `useFetch`            |
| `useSse({ client })` without provider  | Assume `useFetch` performs HTTP            |

## More detail

- Entry points & sizes: [references/entry-points.md](references/entry-points.md)
- WebSocket / WebTransport / NDJSON: https://mohamadgarmabi.github.io/tanstack-fetch/guide/websocket
- Cookbook (every feature): https://mohamadgarmabi.github.io/tanstack-fetch/examples/cookbook
- Status handlers map: [references/status-handlers.md](references/status-handlers.md)
- Vue guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/vue
- Solid: https://mohamadgarmabi.github.io/tanstack-fetch/guide/solid
- Angular: https://mohamadgarmabi.github.io/tanstack-fetch/guide/angular
- Svelte: https://mohamadgarmabi.github.io/tanstack-fetch/guide/svelte
- Release 2.0.0: https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-2-0-0
- Release 1.8.0: https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-8-0
- Release 1.7.1: https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-7-1
- Release 1.7.0: https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-7-0
- Changelog 1.6.1: https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-6
- Doctor: `npx tanstack-fetch doctor [--dir ./src]` (alias `--doctor`)
- Migrate CLI: `npx tanstack-fetch migrate --from axios|ky|ofetch|fetch|all [--framework react|vue|nuxt|nextjs|solid|angular|svelte|sveltekit] [--provider|--no-provider] [--write]`
  - React: prompts for FetchProvider (default: no); `--provider` / `--no-provider` skip the prompt
- Migrate guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate
