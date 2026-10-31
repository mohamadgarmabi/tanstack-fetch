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
import {
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createStatusInterceptor,
} from 'tanstack-fetch/plugins'

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
  interceptors: [
    createAuthInterceptor({ getToken: () => accessToken }),
    createStatusInterceptor({
      401: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('access_expires_at')
        window.location.href = '/login'
      },
    }),
  ],
})

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{
        accessToken: string
        expiresIn: number
      }>('/auth/refresh', {
        // Avoid infinite 401 → refresh → 401 loops
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      persist(body.accessToken, body.expiresIn)
    },
    // BEFORE — proactive, based on time
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000, // refresh 1 minute before expiry
    },
    // AFTER — reactive, first 401 only (default: enabled)
    after: { enabled: true },
    onRefreshFailed: () => {
      // optional; the 401 status handler still runs if the retry path continues
    },
  }),
)
```

## After only (401)

Omit `before` if you only want reactive refresh:

```ts
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
  }),
)
```

## Before only (time)

Disable `after` if you only want proactive refresh:

```ts
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
    after: false,
  }),
)
```

## Notes

- Call refresh with `api.post(..., { interceptors: { eject: ['refresh-token', 'auth'] } })` so the same client is used without re-entering the interceptor. `createAuthInterceptor` is named `'auth'`
- `credentials: 'include'` on `createFetch` sends the refresh cookie with that call
- Order `10` runs **before** auth (`15`), so a before-refresh updates the token that gets attached
- `attempt > 0` blocks infinite 401 refresh loops on the original request
- One shared `refreshPromise` covers parallel requests (before and after)
- A failed refresh continues the pipeline, so the `401` handler from `createStatusInterceptor` (order `95`) can send the user to login
- On `tanstack-fetch/sse`, `/live`, `/trpc` and the framework providers, `getToken` and `onUnauthorized` are still accepted as options

## Related

- [Plugins · interceptors](/guide/plugins)
- [Configuration · 401/403](/guide/configuration)
- [Migrate from axios](/guide/migrate) — axios interceptor alternative
- [SSE + auth](/guide/sse) — refresh with stream auth
- [WebSocket / NDJSON](/guide/websocket) — `api.ws` / `api.transport` call the auth interceptor's `getToken` again on every reconnect, and `api.stream` retries after a 401 refresh
