# Refresh tokens without the spaghetti: before expiry and after 401

tanstack-fetch 1.3.0 ships `createRefreshTokenInterceptor` — one helper for proactive (time-based) and reactive (first 401) refresh, with single-flight built in.

---

Most apps that talk to a secured API eventually hit the same problem:

> Access tokens expire. Refresh tokens exist. And somehow every request race ends up calling `/auth/refresh` three times.

People solve it differently. Some refresh only after a `401`. Some try to refresh a minute before expiry. Many copy an interceptor from Stack Overflow and hope parallel requests share one refresh promise.

I wanted both strategies in one place — with a clear structure — so I shipped them in **tanstack-fetch 1.3.0**.

## What is tanstack-fetch?

[tanstack-fetch](https://www.npmjs.com/package/tanstack-fetch) is a typed Fetch client shaped for TanStack Query (React Query).

The mental model is small:

1. Return **data** on success
2. Throw a typed **FetchError** on HTTP failure
3. Honor **AbortSignal**

That is exactly what `queryFn` already expects. No `.data` unwrap. No axios adapter glue.

HTTP core is about **3.5KB gzip**. SSR, SSE, upload, React helpers, and tRPC are optional entry points.

Not an official TanStack package — just shaped for the same call site.

## The refresh problem, in two sentences

**Before the request:** if the access token is about to expire, refresh it first so the call never sees a 401.

**After a 401:** if the server still rejects you, refresh once, retry the original request, and only logout if refresh fails.

Both paths need **single-flight** refresh. If ten queries 401 at once, you still call `/auth/refresh` once.

## The new API: before + after

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
        // Same client — eject so the interceptor cannot recurse
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      persist(body.accessToken, body.expiresIn)
    },

    // BEFORE — time-based
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000, // refresh 1 minute early
    },

    // AFTER — first 401 only
    after: { enabled: true },
  }),
)
```

That is the whole structure.

| Strategy   | When it runs                  | What it does                                             |
| ---------- | ----------------------------- | -------------------------------------------------------- |
| **before** | `now >= expiresAt - skewMs`   | Refresh on `onRequest`, then auth attaches the new token |
| **after**  | First `401` (`attempt === 0`) | Single-flight refresh, then `{ action: 'retry' }`        |

Need only reactive refresh? Omit `before`.

Need only proactive refresh? Set `after: false`.

Failed refresh continues the pipeline, so your existing `onUnauthorized` can send the user to login.

## Why this belongs next to Query

TanStack Query already retries, cancels, and caches. Your HTTP client should not fight that.

tanstack-fetch returns data and throws. The refresh interceptor retries the **HTTP** call once with a new token. Query still owns loading state, cache keys, and UI errors.

That split keeps auth logic out of every `useQuery` and every screen.

## What else landed recently

### 1.2.1 — path-typed params

```ts
api.get('/users/:id', { params: { id: userId } })
```

Required keys are inferred from `:param` / `{param}` patterns.

### 1.2.0 — first-class 4xx handlers

`onUnauthorized`, `onTooManyRequests`, `onClientError`, plus `parseRetryAfter` for rate limits.

### Docs

The site now has a clearer homepage, a live comparison story, StackBlitz links, and an `llms.txt` for AI tools.

## Try it

```bash
npm install tanstack-fetch @tanstack/react-query
```

```ts
import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get('/users', { signal }),
})
```

## Links

- [npm](https://www.npmjs.com/package/tanstack-fetch)
- [Docs](https://mohamadgarmabi.github.io/tanstack-fetch/)
- [Refresh recipe](https://mohamadgarmabi.github.io/tanstack-fetch/recipes/refresh-token)
- [GitHub](https://github.com/mohamadgarmabi/tanstack-fetch)
- [Changelog 1.3.0](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)

If you build TanStack Query apps and are tired of hand-rolled refresh queues, try the before/after helper and tell me what still hurts. Issues and PRs welcome.
