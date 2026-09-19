# tanstack-fetch

**Typed Fetch client designed for TanStack Query.**

A **react-query fetch client** / **axios alternative for TanStack Query** — tiny HTTP core, typed errors, AbortSignal, SSR, SSE, plugins.

Tiny HTTP core · Typed errors · 401 / 403 / 404 / 5xx handling · AbortSignal · SSE · SSR · Plugins · React

[![npm version](https://img.shields.io/npm/v/tanstack-fetch.svg)](https://www.npmjs.com/package/tanstack-fetch)
[![npm downloads](https://img.shields.io/npm/dw/tanstack-fetch.svg)](https://www.npmjs.com/package/tanstack-fetch)
[![bundle size](https://img.shields.io/bundlephobia/minzip/tanstack-fetch)](https://bundlephobia.com/package/tanstack-fetch)
[![license](https://img.shields.io/npm/l/tanstack-fetch.svg)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/mohamadgarmabi/tanstack-fetch/ci.yml?branch=main&label=CI)](https://github.com/mohamadgarmabi/tanstack-fetch/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6.svg)](https://www.typescriptlang.org/)

<p align="center">
  <img src="./docs/assets/tanstack-fetch-hero.gif" alt="tanstack-fetch — createFetch + TanStack Query" width="720" />
</p>

<p align="center"><b>createFetch</b> + <b>TanStack Query</b> — return data, throw on error, honor <code>signal</code>.</p>

## 30-second quickstart

```bash
npm install tanstack-fetch @tanstack/react-query
```

```ts
import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

That’s it: returns data, throws `FetchError` on HTTP errors, honors Query’s `signal`.

**Examples:** [`examples/`](./examples) · **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md)

> Not an official TanStack package — built to match the `@tanstack/react-query` mental model.

---

## Why tanstack-fetch

Built for the way TanStack Query actually works: return data, throw on failure, honor `signal`.

|                     |                                                                     |
| ------------------- | ------------------------------------------------------------------- |
| **Tiny HTTP core**  | ~3.5KB gzip — tree-shakeable entry points                           |
| **Typed errors**    | `FetchError` with `status`, `code`, `body` + `isFetchError()`       |
| **Status handling** | First-class `401` / `403` / `404` / `5xx` (and `onStatus` map)      |
| **AbortSignal**     | Pass Query’s `signal` — cancels cleanly, no false errors            |
| **SSE**             | Streams over `fetch` (auth + cookies work) via `tanstack-fetch/sse` |
| **SSR**             | Next.js-ready cookie / header forwarding (`ssr-forward`)            |
| **Plugins**         | Named interceptors: retry, trace, mocks, eject per request          |
| **React**           | Optional `FetchProvider`, `useFetch`, `useSse`                      |
| **tRPC**            | `tanstack-fetch/trpc` — same auth/plugins with Router & Start       |

Also: multipart **upload** + progress, OpenAPI codegen CLI, Edge-friendly.

Compared to **axios / ky / ofetch**: same mental model as TanStack Query `queryFn`, ~3.5KB core, SSR cookie forwarding, and SSE with Authorization — without pulling a large HTTP stack.

---

## Quick taste

```ts
import { createFetch, isFetchError } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
})

const user = await api.get<User>('/users/:id', { params: { id: '1' } })

try {
  await api.get('/missing')
} catch (error) {
  if (isFetchError(error)) console.log(error.status, error.message)
}
```

---

## Bundle size

| Import                   | What you get               | Typical gzip |
| ------------------------ | -------------------------- | ------------ |
| `tanstack-fetch`         | HTTP (`get/post/upload/…`) | **~3.5KB**   |
| `tanstack-fetch/sse`     | + `api.sse()`              | **~4.7KB**   |
| `tanstack-fetch/plugins` | plugin factories           | **~0.9KB**   |
| `tanstack-fetch/react`   | `FetchProvider` / hooks    | **~1KB**     |
| `tanstack-fetch/trpc`    | tRPC link via `createFetch` | **~3.1KB**   |

```ts
import { createFetch } from 'tanstack-fetch' // HTTP only
import { createFetch } from 'tanstack-fetch/sse' // + streams
```

`yaml` and React are optional peers. Run `npm run size` after build for local gzip numbers.

---

## tRPC (React · Router · Start)

Same `createFetch` client — drop into tRPC:

```bash
npm install tanstack-fetch @trpc/client @trpc/tanstack-react-query @tanstack/react-query
```

```ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from './server'

const api = createFetch({
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => localStorage.removeItem('access_token'),
})

const queryClient = new QueryClient()
const trpcClient = createTRPCFetchClient<AppRouter>({
  url: '/api/trpc',
  client: api,
})
const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient })

// React / Router / Start
useQuery(trpc.post.list.queryOptions())
```

Full setup (Router loaders, TanStack Start SSR): [`docs/recipes/trpc.md`](./docs/recipes/trpc.md)

---

## Compared to axios / ky / ofetch

| Need                               | tanstack-fetch                                    |
| ---------------------------------- | ------------------------------------------------- |
| Drop into TanStack Query `queryFn` | Returns data, throws `FetchError`, takes `signal` |
| Next.js SSR cookies                | `ssr-forward` plugin                              |
| Interceptors without axios weight  | Named, ordered, ejectable plugins                 |
| SSE with Authorization             | `tanstack-fetch/sse` (not `EventSource`)          |
| File upload + progress             | `api.upload()` + `onUploadProgress`               |
| Bundle                             | ~3.5KB gzip HTTP core                             |

**Recipes:** [refresh token on 401](./docs/recipes/refresh-token.md) · [examples](./examples) · [social post draft](./docs/social-post.md)

---

## Two ways to configure

### 1) Simple path — `baseUrl`, token, status handlers

Most apps only need this: set API URL, attach a token, and decide what happens on **401 / 403 / 404 / 5xx**.

```ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),

  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login' // 401
  },
  onForbidden: () => {
    console.warn('No permission') // 403
  },
  onNotFound: ({ error }) => {
    console.warn('Missing resource', error.message) // 404
  },
  onServerError: ({ status }) => {
    console.error('Server error', status) // 500–599
  },
})
```

Handlers run **before** the error is thrown (so TanStack Query still gets `isError` / `FetchError`).

| Option              | When                                               |
| ------------------- | -------------------------------------------------- |
| `getToken` / `auth` | Every request — sets `Authorization: Bearer …`     |
| `onUnauthorized`    | HTTP **401**                                       |
| `onForbidden`       | HTTP **403**                                       |
| `onNotFound`        | HTTP **404**                                       |
| `onServerError`     | HTTP **5xx**                                       |
| `onStatus`          | Advanced map (exact code, `4xx`, `5xx`, `default`) |

```ts
createFetch({
  baseUrl: 'https://api.example.com',
  auth: {
    getToken: async () => (await cookies()).get('token')?.value,
    header: 'authorization',
    scheme: 'Bearer', // use '' for a raw token / API key
  },
  onStatus: {
    401: () => redirect('/login'),
    403: () => toast.error('Forbidden'),
    404: () => toast.error('Not found'),
    500: () => toast.error('Server error'),
    '5xx': ({ status }) => console.error('upstream', status),
    default: ({ status }) => console.warn('unhandled', status),
  },
})
```

### 2) Advanced path — plugins + custom interceptors

Full control: plugins, named interceptors, per-request eject, match filters.

```ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
  getToken: () => getAccessToken(),
  onUnauthorized: () => logout(),
  interceptors: [
    {
      name: 'locale',
      order: 25,
      onRequest: (context) => {
        context.request.headers.set('accept-language', 'fa')
        return { action: 'continue', context }
      },
    },
  ],
})

api.use('audit', {
  onResponse: (context) => {
    console.log(context.response?.status, context.request.url.pathname)
    return { action: 'continue', context }
  },
})
```

### React `FetchProvider` (optional)

Same config, shared via context — like wrapping your app once.

```tsx
import { FetchProvider, useFetch } from 'tanstack-fetch/react'
import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'

const App = () => (
  <FetchProvider
    baseUrl={import.meta.env.VITE_API_URL}
    getToken={() => localStorage.getItem('access_token')}
    onUnauthorized={() => {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }}
    onForbidden={() => console.warn('403')}
    onNotFound={() => console.warn('404')}
    onServerError={({ status }) => console.error('5xx', status)}
    plugins={['trace', 'retry-idempotent']}
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
  if (isFetchError(error))
    return (
      <p>
        {error.status}: {error.message}
      </p>
    )
  return (
    <ul>
      {data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}
```

Or pass an existing client:

```tsx
const api = createFetch({ baseUrl: '…', getToken: … })

<FetchProvider client={api}>
  <App />
</FetchProvider>
```

---

## Why this API matches TanStack Query

| TanStack Query needs   | `tanstack-fetch` does                            |
| ---------------------- | ------------------------------------------------ |
| `queryFn` returns data | `api.get<T>()` → `Promise<T>`                    |
| Failures must throw    | HTTP errors throw `FetchError`                   |
| Cancellation           | Pass `{ signal }` from `queryFn` context         |
| Typed errors           | `isFetchError(error)` → `status`, `code`, `body` |

### Install peers

```bash
npm install tanstack-fetch @tanstack/react-query
```

### Shared client

```ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  plugins: ['trace', 'retry-idempotent'],
})
```

### `useQuery` — basic

```tsx
import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import { api } from '#/lib/api'

type User = { id: string; name: string }

const UsersPage = () => {
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error))
    return (
      <p>
        {error.status}: {error.message}
      </p>
    )
  if (error) return <p>Something went wrong</p>

  return (
    <div>
      <button onClick={() => refetch()} disabled={isFetching}>
        Refresh
      </button>
      <ul>
        {data.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default UsersPage
```

### `useQuery` — with params + `enabled`

```tsx
import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import { api } from '#/lib/api'

type User = { id: string; name: string; email: string }

const UserDetail = ({ userId }: { userId?: string }) => {
  const { data, error, isPending } = useQuery({
    queryKey: ['users', userId],
    enabled: Boolean(userId),
    queryFn: ({ signal }) =>
      api.get<User>('/users/:id', {
        params: { id: userId! },
        signal,
      }),
  })

  if (!userId) return <p>Select a user</p>
  if (isPending) return <p>Loading…</p>
  if (isFetchError(error)) {
    if (error.status === 404) return <p>User not found</p>
    return (
      <p>
        {error.code}: {error.message}
      </p>
    )
  }
  if (error) return <p>Something went wrong</p>

  return (
    <article>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </article>
  )
}

export default UserDetail
```

### `useQuery` + official `queryOptions`

Share the same options between components, prefetch, and SSR:

```ts
// src/queries/users.ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '#/lib/api'

type User = { id: string; name: string }

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.get<User>('/users/:id', { params: { id }, signal }),
  })
```

```tsx
import { useQuery } from '@tanstack/react-query'
import { userQueryOptions, usersQueryOptions } from '#/queries/users'

const UsersPage = () => {
  const { data: users } = useQuery(usersQueryOptions)
  return (
    <ul>
      {users?.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}

const UserPage = ({ id }: { id: string }) => {
  const { data: user } = useQuery(userQueryOptions(id))
  return <h1>{user?.name}</h1>
}
```

### `useMutation` + invalidate

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import { api } from '#/lib/api'

type CreateUser = { name: string; email: string }
type User = CreateUser & { id: string }

const CreateUserForm = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (body: CreateUser) => api.post<User>('/users', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        mutation.mutate({
          name: String(form.get('name')),
          email: String(form.get('email')),
        })
      }}
    >
      <input name="name" />
      <input name="email" type="email" />
      <button type="submit" disabled={mutation.isPending}>
        Create
      </button>
      {isFetchError(mutation.error) && (
        <p>
          {mutation.error.status}: {mutation.error.message}
        </p>
      )}
    </form>
  )
}

export default CreateUserForm
```

### Provider setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

const App = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default App
```

---

## Quick start

```ts
import { createFetch, isFetchError } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: 'https://api.example.com',
})

// Success → data
const user = await api.get<User>('/users/:id', { params: { id: '1' } })
user.name

// Failure → throws FetchError (like queryFn)
try {
  await api.get('/missing')
} catch (error) {
  if (isFetchError(error)) {
    error.status // 404
    error.code
    error.body
  }
}
```

Need a Result union instead? Opt out per client or per call:

```ts
const api = createFetch({ baseUrl: '...', throwOnError: false })

const result = await api.get<User>('/users/1', { throwOnError: false })
if (result.ok) result.data
else result.error
```

---

## Create a client (`createFetch`)

Same spirit as `createQueryClient` — one shared client, default options, plugins.

```ts
import { createFetch } from 'tanstack-fetch'
import { cookies } from 'next/headers'

export const api = createFetch({
  baseUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
  source: 'ssr', // 'browser' | 'ssr' | 'edge'
  timeoutMs: 15_000,
  maxRetries: 2,
  throwOnError: true, // default — Query-friendly
  credentials: 'include',
  headers: { 'x-app': 'web' },
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
  incoming: async () => ({
    cookie: (await cookies()).toString(),
  }),
})
```

| Option         | Default            | Notes                             |
| -------------- | ------------------ | --------------------------------- |
| `baseUrl`      | —                  | Absolute URL required on SSR/Edge |
| `source`       | `'browser'`        | Runtime                           |
| `throwOnError` | `true`             | `false` → `FetchResult`           |
| `plugins`      | `[]`               | Built-in interceptors             |
| `timeoutMs`    | `30000`            | Combined with Query `signal`      |
| `maxRetries`   | `2`                | For interceptor `retry` actions   |
| `fetch`        | `globalThis.fetch` | Inject in tests                   |

---

## HTTP

```ts
await api.get<User[]>('/users')
await api.get<User>('/users/:id', { params: { id: '42' }, signal })
await api.get<User[]>('/users', { query: { page: 1, active: true } })

await api.post<User>('/users', { body: { name: 'Ada' } })
await api.put<User>('/users/:id', { params: { id: '42' }, body: { name: 'Ada' } })
await api.patch<User>('/users/:id', { params: { id: '42' }, body: { email: 'a@b.c' } })
await api.delete<void>('/users/:id', { params: { id: '42' } })

await api.request<User>('GET', '/users/:id', { params: { id: '1' } })
```

---

## Upload

`FormData` / `Blob` / `File` are sent as-is (no JSON, no forced `Content-Type` — the boundary stays correct).

The call still returns the **typed response body** from the server (same as `post`), not a special upload envelope.

### `api.upload()` — file + fields + progress

```ts
type UploadResponse = { id: string; url: string }

const file = input.files[0]

const uploaded = await api.upload<UploadResponse>('/files', {
  file,
  fieldName: 'avatar', // default: 'file'
  fields: { folder: 'avatars', public: true },
  onUploadProgress: ({ loaded, total, progress }) => {
    // progress is 0–1 when total is known (browser / XHR)
    console.log(loaded, total, progress)
  },
})

uploaded.url
```

Multiple files or raw `FormData`:

```ts
await api.upload('/docs', {
  method: 'PUT',
  files: [fileA, fileB],
  fieldName: 'docs',
})

await api.upload<UploadResponse>('/files', {
  body: createFormData({ file, note: 'cv' }),
})
```

### `createFormData` helper

```ts
import { createFetch, createFormData } from 'tanstack-fetch'

const api = createFetch({ baseUrl: 'https://api.example.com' })

const body = createFormData({
  title: 'Report',
  tags: ['a', 'b'], // repeated field
  file,
})

await api.post<UploadResponse>('/files', {
  body,
  onUploadProgress: ({ progress }) => console.log(progress),
})
```

| Option             | Notes                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `file` / `files`   | Appended under `fieldName` (default `"file"`)                                                                                                |
| `fields`           | Extra multipart values (string / number / boolean / `Blob` / arrays)                                                                         |
| `body`             | Pre-built `FormData` / `Blob` / …                                                                                                            |
| `method`           | `POST` (default), `PUT`, or `PATCH`                                                                                                          |
| `onUploadProgress` | Browser-only — uses XHR under the hood (`fetch` has no upload progress). No-ops on runtimes without `XMLHttpRequest` (falls back to `fetch`) |

Works with TanStack Query mutations the same way as `post`:

```ts
useMutation({
  mutationFn: (file: File) =>
    api.upload<UploadResponse>('/files', {
      file,
      onUploadProgress: ({ progress }) => setProgress(progress ?? 0),
    }),
})
```

---

## `FetchError`

```ts
import { FetchError, isFetchError } from 'tanstack-fetch'

try {
  await api.get('/secure')
} catch (error) {
  if (isFetchError(error)) {
    error.status
    error.code
    error.message
    error.body
    error.headers
    error.result // full FetchResult
  }
}
```

Abort / cancel from TanStack Query is **not** wrapped — `AbortError` propagates so Query can ignore cancelled fetches.

---

## Plugins

Built-in interceptors — enable by name:

```ts
createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
})
```

| Plugin             | Role                                                      |
| ------------------ | --------------------------------------------------------- |
| `trace`            | Sets `x-request-id`                                       |
| `ssr-forward`      | Forwards cookie/auth/request-id on SSR (no-op in browser) |
| `retry-idempotent` | Retries GET/HEAD/OPTIONS on 502/503/504                   |
| `sse-resume`       | Drops heartbeats; sends `Last-Event-ID` on reconnect      |

```ts
import { createFetch, createTraceInterceptor, createSsrForwardInterceptor } from 'tanstack-fetch'

const api = createFetch({ baseUrl: 'https://api.example.com' })
api.use('trace', createTraceInterceptor())
api.use('ssr-forward', createSsrForwardInterceptor())
```

### `trace`

```ts
const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['trace'],
  incoming: { requestId: 'req-from-gateway' },
})
await api.get('/users')
// → header x-request-id: req-from-gateway
```

### `ssr-forward` (Next.js)

```ts
import { cookies, headers } from 'next/headers'
import { createFetch } from 'tanstack-fetch'

export const createServerApi = async () =>
  createFetch({
    baseUrl: process.env.API_URL!,
    source: 'ssr',
    plugins: ['ssr-forward', 'trace', 'retry-idempotent'],
    incoming: async () => {
      const jar = await cookies()
      const h = await headers()
      return {
        cookie: jar.toString(),
        authorization: h.get('authorization') ?? undefined,
        requestId: h.get('x-request-id') ?? undefined,
      }
    },
  })
```

### `retry-idempotent`

```ts
const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['retry-idempotent'],
  maxRetries: 2,
})

await api.get('/health') // may retry on 503
await api.post('/orders', { body: { sku: 'A' } }) // not retried
```

### `sse-resume`

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
})

api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => {
    // ping / heartbeat never reach here
    console.log(data)
  },
})
```

---

## Interceptors

Named, ordered, removable — customize auth, logging, mocks.

```ts
api.use('auth', {
  order: 20,
  onRequest: async (context) => {
    context.request.headers.set('authorization', `Bearer ${await getToken()}`)
    return { action: 'continue', context }
  },
  onResponseError: async (context) => {
    if (context.error?.status !== 401 || context.meta.attempt > 0) {
      return { action: 'continue', context }
    }
    await refreshToken()
    return { action: 'retry' }
  },
})

api.eject('auth')

// Per-request
await api.get('/public', { interceptors: { eject: ['auth'] } })
```

### Actions

`continue` · `skip` · `drop` (SSE) · `retry` · `short-circuit`

### Hooks

`onRequest` · `onRequestError` · `onResponse` · `onResponseError` · `onSseOpen` · `onSseEvent` · `onSseError` · `onSseReconnect`

### Mock short-circuit

```ts
api.use('mock-users', {
  match: { pathPrefix: '/users' },
  onRequest: () => ({
    action: 'short-circuit',
    result: {
      ok: true,
      status: 200,
      data: [{ id: '1', name: 'Ada' }],
      headers: new Headers(),
    },
  }),
})
```

---

## TanStack Query + Next.js SSR

```ts
// lib/api.ts
import { createFetch } from 'tanstack-fetch'
import { cookies } from 'next/headers'

export const createServerApi = async () =>
  createFetch({
    baseUrl: process.env.API_URL!,
    source: 'ssr',
    plugins: ['trace', 'ssr-forward', 'retry-idempotent'],
    incoming: async () => ({ cookie: (await cookies()).toString() }),
  })
```

```tsx
// app/users/page.tsx — prefetch into Query cache
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createServerApi } from '#/lib/api'
import { UsersClient } from './users-client'

const UsersPage = async () => {
  const api = await createServerApi()
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient />
    </HydrationBoundary>
  )
}

export default UsersPage
```

```tsx
// users-client.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { createFetch } from 'tanstack-fetch'

const browserApi = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  source: 'browser',
  credentials: 'include',
  plugins: ['trace', 'retry-idempotent'],
})

export const UsersClient = () => {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => browserApi.get<User[]>('/users', { signal }),
  })

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

---

## SSE

Uses `fetch` streams (not `EventSource`) — Authorization, cookies, and SSR work.

### Simple — `onMessage`

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
})

const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => {
    console.log(data) // just the payload
  },
  onError: (error) => console.error(error),
})

// later
stream.close()
```

### React — `useSse`

Pass a client created from `tanstack-fetch/sse`:

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { FetchProvider, useSse } from 'tanstack-fetch/react'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['sse-resume'],
})

const App = () => (
  <FetchProvider client={api}>
    <OrdersLive />
  </FetchProvider>
)

const OrdersLive = () => {
  const { data, isConnected, error } = useSse<OrderEvent>('/orders/stream')

  if (error) return <p>Stream failed</p>
  return (
    <p>
      {isConnected ? 'Live' : 'Connecting…'} {data?.status}
    </p>
  )
}
```

### Advanced — `for await`

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({ baseUrl: 'https://api.example.com' })

for await (const event of api.sse<OrderEvent>('/orders/stream', { signal })) {
  event.event
  event.data
  event.id
}
```

---

## OpenAPI CLI

```bash
npx tanstack-fetch generate --spec ./openapi.yaml --out ./src/api
```

```ts
import { createApi } from './api'
import { queryOptions } from '@tanstack/react-query'

const api = createApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  plugins: ['trace', 'retry-idempotent'],
})

export const getUserOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.users.getUser({ params: { id }, signal }),
  })
```

---

## Helpers

```ts
import { unwrap, unwrapAsync, isFetchError, isAbortError } from 'tanstack-fetch'

// When you already have a FetchResult
const user = unwrap(result)
const user2 = await unwrapAsync(api.get('/users/1', { throwOnError: false }))
```

---

## Example

```bash
npm run example
```

Copy-paste apps under [`examples/`](./examples):

| App                                           | Focus                               |
| --------------------------------------------- | ----------------------------------- |
| [`basic-http`](./examples/basic-http)         | Plain `get` / `post` / `FetchError` |
| [`tanstack-query`](./examples/tanstack-query) | `useQuery` + `useMutation`          |
| [`auth-status`](./examples/auth-status)       | Token + 401 / 403 / 404 / 5xx       |
| [`file-upload`](./examples/file-upload)       | `api.upload` + progress             |
| [`sse-live`](./examples/sse-live)             | `useSse` live stream                |
| [`next-ssr`](./examples/next-ssr)             | App Router + `ssr-forward`          |
| [`trpc`](./examples/trpc)                     | tRPC + `createTRPCFetchClient`      |

## API

```ts
import {
  createFetch,
  createFormData,
  createFetchError,
  isFetchError,
  isAbortError,
  unwrap,
  unwrapAsync,
  createTraceInterceptor,
  createSsrForwardInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
} from 'tanstack-fetch'
```

| Method                         | Description                            |
| ------------------------------ | -------------------------------------- |
| `get/post/put/patch/delete`    | Typed HTTP → `Promise<T>`              |
| `upload(path, opts?)`          | Multipart / file upload → `Promise<T>` |
| `request(method, path, opts?)` | Generic verb                           |
| `sse(path, { onMessage })`     | Simple stream — returns `{ close }`    |
| `sse(path)`                    | Advanced — `for await` iterable        |
| `use` / `eject`                | Interceptors                           |
| `createFormData(fields)`       | Build `FormData` from a plain object   |

## FAQ

**Is tanstack-fetch an official TanStack package?**  
No. It is an independent MIT library shaped for `@tanstack/react-query`.

**Can I use it without React Query?**  
Yes. It is a plain TypeScript `fetch` client; React Query is optional.

**Does it work with Next.js App Router SSR?**  
Yes. Use `source: 'ssr'`, the `ssr-forward` plugin, and `incoming` cookies/headers.

**How do I upload files?**  
Use `api.upload({ file, fields, onUploadProgress })` or `api.post` with `createFormData(...)`.

## License

MIT
