---
name: tanstack-fetch
description: >-
  Build and wire tanstack-fetch (typed Fetch client for TanStack Query): createFetch,
  path params, FetchError, status handlers, plugins, SSR, SSE, upload, React hooks,
  and tRPC. Use when adding or changing HTTP clients, queryFn, axios alternatives,
  SSE streams, or when the user mentions tanstack-fetch.
license: MIT
metadata:
  author: Mohammad Garmabi
  package: tanstack-fetch
  docs: https://mohamadgarmabi.github.io/tanstack-fetch/
  npm: https://www.npmjs.com/package/tanstack-fetch
---

# tanstack-fetch

Typed Fetch client shaped for TanStack Query. Not an official TanStack package.

Docs: https://mohamadgarmabi.github.io/tanstack-fetch/  
npm: `tanstack-fetch`

## Mental model (always)

1. **Return data** on success
2. **Throw `FetchError`** on HTTP failure (default)
3. **Honor `AbortSignal`** — pass Query’s `signal`

Never wrap responses as `{ data }` like axios. Prefer one shared `api` module.

## Install

```bash
# npm
npm install tanstack-fetch @tanstack/react-query

# pnpm
pnpm add tanstack-fetch @tanstack/react-query

# yarn
yarn add tanstack-fetch @tanstack/react-query

# bun
bun add tanstack-fetch @tanstack/react-query
```

## Entry points

| Import                   | Use when                                       |
| ------------------------ | ---------------------------------------------- |
| `tanstack-fetch`         | HTTP only (`get` / `post` / `upload` / …)      |
| `tanstack-fetch/sse`     | Need `api.sse()` (fetch-based streams + auth)  |
| `tanstack-fetch/plugins` | Factories (`createRefreshTokenInterceptor`, …) |
| `tanstack-fetch/react`   | `FetchProvider`, `useFetch`, `useSse`          |
| `tanstack-fetch/trpc`    | tRPC link via the same client                  |

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

`:id` segments require `params`. TypeScript enforces keys from the path literal.

```ts
await api.get<User>('/users/:id', { params: { id } })
await api.get<User[]>('/users', { query: { page: 1 } })
```

## TanStack Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

useMutation({
  mutationFn: (body: CreateUser) => api.post<User>('/users', { body }),
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

For `FetchResult` instead of throw: `{ throwOnError: false }`.

## SSE

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

for await (const event of api.sse<OrderEvent>('/orders/stream', { signal })) {
  console.log(event.data)
}
```

React: `FetchProvider` + `useSse` from `tanstack-fetch/react`.

## SSR (Next.js)

Use absolute `baseUrl`. Forward cookies with `ssr-forward`:

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

Refresh via factory + `api.use`:

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

## More detail

- Entry points & sizes: [references/entry-points.md](references/entry-points.md)
- Status handlers map: [references/status-handlers.md](references/status-handlers.md)
