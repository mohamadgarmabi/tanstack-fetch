---
title: Refresh token
description: Prevent duplicate refresh-token calls with createRefreshTokenInterceptor — single-flight 401 refresh for TanStack Query.
---

# Refresh token

![Auth and 401 status handling](/images/docs-auth-status.png)

Your `queryFn` throws on `401`. The interceptor refreshes **once** (single-flight) — never duplicates parallel requests — then retries the failed call.

## Problem

Without single-flight, N parallel `401` responses trigger N refresh requests. One should do the work; the rest should wait.

## How it works

```ts
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

api.use('refresh-token', createRefreshTokenInterceptor({
  refresh: async () => { ... },
  after: { enabled: true }, // reactive after first 401
}))
```

- One `refreshPromise` covers parallel failures.
- `attempt > 0` blocks infinite 401 → refresh → 401 loops.
- Refresh calls the **same** client with `interceptors: { eject: ['refresh-token', 'auth'] }` so it doesn’t recurse.

## Before + after

| Strategy | When                     | How                                                      |
| -------- | ------------------------ | -------------------------------------------------------- |
| Before   | Near expiry (time-based) | `before.getExpiresAt` + `skewMs`                         |
| After    | First `401`              | Refresh once, `{ action: 'retry' }`, then retry original |

## Full example

Use `createRefreshTokenInterceptor` from `tanstack-fetch/plugins`. It covers both strategies:

```ts
import { createFetch } from 'tanstack-fetch'
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

let accessToken = localStorage.getItem('access_token')
let expiresAt = Number(localStorage.getItem('access_expires_at') ?? 0)

const persist = (token: string, expiresInSeconds: number) => {
  accessToken = token
  expiresAt = Date.now() + expiresInSeconds * 1000
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('access_expires_at', String(expiresAt))
}

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
  getToken: () => accessToken,
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('access_expires_at')
    window.location.href = '/login'
  },
})

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{
        accessToken: string
        expiresIn: number
      }>('/auth/refresh', {
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      persist(body.accessToken, body.expiresIn)
    },
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000,
    },
    after: { enabled: true },
    onRefreshFailed: () => {},
  }),
)
```

(Full code preserved from original; see original for after-only / before-only variants.)

## Related

- [Plugins · interceptors](/guide/plugins)
- [Configuration · 401/403](/guide/configuration)
- [Migrate from axios](/guide/migrate) — axios interceptor alternative
- [SSE + auth](/guide/sse) — refresh with stream auth
- [WebSocket / NDJSON](/guide/websocket) — `api.ws` / `api.transport` call `getToken` again on every reconnect, and `api.stream` retries after a 401 refresh
