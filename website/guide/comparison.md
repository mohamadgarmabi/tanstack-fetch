# Comparison

![Tree-shakeable entry points](/images/docs-entry-points.png)

tanstack-fetch is an HTTP client shaped for TanStack Query. axios, ky, and ofetch can do the same network work — the difference is the call site.

## Feature matrix

| Need                               | tanstack-fetch                                    | axios   | ky      | ofetch  |
| ---------------------------------- | ------------------------------------------------- | ------- | ------- | ------- |
| Drop into TanStack Query `queryFn` | Returns data, throws `FetchError`, takes `signal` | Adapt   | Adapt   | Adapt   |
| Typed error with status / body     | `FetchError` + `isFetchError`                     | Partial | Partial | Partial |
| Handlers for 401–429               | First-class                                       | Custom  | Custom  | Custom  |
| Refresh token + single-flight      | Interceptor + `{ action: 'retry' }`               | Custom  | Custom  | Custom  |
| Next.js SSR cookies                | `ssr-forward` plugin                              | Custom  | Custom  | Custom  |
| SSE with Authorization             | `tanstack-fetch/sse`                              | No      | No      | No      |
| File upload + progress             | `api.upload()`                                    | Yes     | Limited | Limited |
| tRPC transport                     | `tanstack-fetch/trpc`                             | No      | No      | No      |
| Bundle                             | ~3.5KB gzip HTTP core                             | Larger  | Small   | Small   |

## Before / after

### axios into Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: async ({ signal }) => {
    const response = await axios.get('/users', { signal })
    return response.data
  },
})
```

### tanstack-fetch into Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

No `.data` unwrap. HTTP failures throw, so Query’s `isError` path stays honest.

## Refresh token

```ts
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      /* update accessToken (+ expiresAt) */
    },
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000,
    },
    after: { enabled: true },
  }),
)
```

Full recipe: [Refresh token](/recipes/refresh-token).

## When to keep axios

- You already have a large axios interceptor stack and no Query migration planned
- You need axios-specific adapters that are not fetch-based

Otherwise, if TanStack Query is the source of truth for loading and errors, tanstack-fetch matches that model with less glue.
