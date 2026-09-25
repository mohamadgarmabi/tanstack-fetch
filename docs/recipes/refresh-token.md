# Recipe: refresh token

Use `createRefreshTokenInterceptor` from `tanstack-fetch/plugins`.

| Strategy | When | How |
| --- | --- | --- |
| **Before** | Token near expiry (time-based) | `onRequest` refreshes, then auth attaches the new token |
| **After** | First `401` | Refresh once (single-flight), then `{ action: 'retry' }` |

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
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('refresh failed')
      const body = (await response.json()) as {
        accessToken: string
        expiresIn: number
      }
      persist(body.accessToken, body.expiresIn)
    },
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000,
    },
    after: { enabled: true },
  }),
)
```

Notes:

- `before` — refresh when `Date.now() >= expiresAt - skewMs`
- `after` — refresh on the first 401 only (`attempt === 0`); set `after: false` to disable
- Single-flight refresh is shared across both paths
- Order `10` runs before auth (`15`) so the new token is attached on the next hop
