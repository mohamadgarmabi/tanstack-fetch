# Why this API?

![Mental model: createFetch → queryFn → data or FetchError](/images/docs-mental-model.png)

TanStack Query’s contract for a `queryFn` is simple. Most HTTP clients fight it.

| TanStack Query needs   | `tanstack-fetch` does                            |
| ---------------------- | ------------------------------------------------ |
| `queryFn` returns data | `api.get<T>()` → `Promise<T>`                    |
| Failures must throw    | HTTP errors throw `FetchError`                   |
| Cancellation           | Pass `{ signal }` from `queryFn`                 |
| Typed errors           | `isFetchError(error)` → `status`, `code`, `body` |

## Designed around Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

No wrapping `if (!res.ok)`, no Result-object dance unless you opt in with `throwOnError: false`.

## Tiny by default

Import only what you need. The HTTP core stays around **~3.5KB gzip**. SSE, React, plugins, and tRPC are separate entries.

## First-class status handling

```ts
createFetch({
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => logout(), // 401
  onForbidden: () => toast.error('Forbidden'), // 403
  onNotFound: () => toast.error('Missing'), // 404
  onServerError: ({ status }) => console.error(status), // 5xx
})
```

Handlers run **before** the error is thrown — Query still sees `isError` / `FetchError`.
