# Refresh token

![Auth and 401 status handling](/images/docs-auth-status.png)

Use `createRefreshTokenInterceptor` from `tanstack-fetch/plugins`. It covers both strategies:

| Strategy | When | How |
| --- | --- | --- |
| **Before** | Token near expiry (time-based) | `onRequest` refreshes, then auth attaches the new token |
| **After** | First `401` | Refresh once (single-flight), then `{ action: 'retry' }` |

## Full example (before + after)

Refresh through the **same `api` client**. Eject `refresh-token` (and `auth`) on that call so the interceptor cannot recurse.

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
      // optional; onUnauthorized still runs if the retry path continues
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

Disable after if you only want proactive refresh:

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

- Call refresh with `api.post(..., { interceptors: { eject: ['refresh-token', 'auth'] } })` so the same client is used without re-entering the interceptor
- `credentials: 'include'` on `createFetch` sends the refresh cookie with that call
- Order `10` runs **before** auth (`15`), so a before-refresh updates the token that gets attached
- `attempt > 0` blocks infinite 401 refresh loops on the original request
- One shared `refreshPromise` covers parallel requests (before and after)
- Failed refresh continues the pipeline so `onUnauthorized` can send the user to login

Source: [`docs/recipes/refresh-token.md`](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/docs/recipes/refresh-token.md)
