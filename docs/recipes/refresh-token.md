# Recipe: refresh token on 401

Keep this **out of the core package** — apps differ on cookie vs memory, single-flight queues, and logout UX. Use a named interceptor:

```ts
import { createFetch } from 'tanstack-fetch'

let accessToken = localStorage.getItem('access_token')
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('refresh failed')
        const body = (await response.json()) as { accessToken: string }
        accessToken = body.accessToken
        localStorage.setItem('access_token', accessToken)
        return accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => accessToken,
  onUnauthorized: () => {
    // final failure after retries — send user to login
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
})

api.use('refresh-token', {
  order: 40,
  onResponseError: async (context) => {
    if (context.error?.status !== 401 || context.meta.attempt > 0) {
      return { action: 'continue', context }
    }
    try {
      await refreshAccessToken()
      return { action: 'retry' }
    } catch {
      return { action: 'continue', context }
    }
  },
})
```

Notes:

- `attempt > 0` prevents infinite refresh loops
- Single-flight `refreshPromise` avoids parallel refresh storms
- Status handler `onUnauthorized` still runs only when retry is **not** chosen (retry has lower `order` than `on-status` when you return `retry` first — put refresh before status, or omit `onUnauthorized` until refresh fails)

With default orders: custom `refresh-token` (40) runs before `retry-idempotent` (80) and `on-status` (95). Returning `{ action: 'retry' }` skips status handlers on that attempt.
