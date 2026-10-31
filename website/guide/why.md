---
title: Why this API?
description: Why tanstack-fetch matches TanStack Query’s queryFn contract better than axios, ky, or ofetch — data in, FetchError out, AbortSignal honored.
---

# Why this API?

![Mental model: createFetch → queryFn → data or FetchError](/images/docs-mental-model.png)

TanStack Query’s contract for a `queryFn` is simple. Most HTTP clients fight it.

| TanStack Query needs   | `tanstack-fetch` does                            |
| ---------------------- | ------------------------------------------------ |
| `queryFn` returns data | `api.get<T>(path)` → `Promise<T>`                |
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

No wrapping `if (!res.ok)` — success returns data, failure throws `FetchError`.

## Tiny by default

Import only what you need. The HTTP core is **3.57KB gzip**. SSE, WebSocket / WebTransport / NDJSON (`tanstack-fetch/live`), React, Vue, plugins, and tRPC are separate entries.

## Realtime on the same client

`api.ws`, `api.transport` and `api.stream` reuse your `getToken`, `refresh-token` and interceptors, and they reconnect with a fresh token. There's no second socket library to wire auth into. See [WebSocket, WebTransport & streams](./websocket).

## First-class status handling

```ts
createFetch({
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({
      401: () => logout(),
      403: () => toast.error('Forbidden'),
      404: () => toast.error('Missing'),
      '5xx': ({ status }) => console.error(status),
    }),
  ],
})
```

On `tanstack-fetch/sse`, `/live` and framework providers these are plain options: `getToken`, `onUnauthorized`, `onForbidden`, `onNotFound`, `onServerError`.

Handlers run **before** the error is thrown — Query still sees `isError` / `FetchError`.
