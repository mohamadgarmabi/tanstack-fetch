---
title: Errors
description: FetchError shape in tanstack-fetch — status, code, message, body — and how to narrow with isFetchError.
---

# Errors

![FetchError with status, code, message, body](/images/docs-errors.png)

Failed HTTP calls throw a **`FetchError`**.

```ts
import { createFetch, isFetchError } from 'tanstack-fetch'

const api = createFetch({ baseUrl: 'https://api.example.com' })

try {
  await api.get('/missing')
} catch (error) {
  if (isFetchError(error)) {
    console.log(error.status) // 404
    console.log(error.code) // e.g. from body
    console.log(error.message)
    console.log(error.body)
    console.log(error.headers.get('retry-after')) // useful for 429
  }
}
```

## Error codes

| Case                                    | What you get                                                           |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Non-2xx response                        | `FetchError` · `code` from the body, else `HTTP_ERROR`                 |
| Non-2xx with a non-JSON body (502 HTML) | `FetchError` · real `status`, `code: 'HTTP_ERROR'`, raw text in `body` |
| 2xx with invalid JSON                   | `FetchError` · `code: 'PARSE_ERROR'`, raw text in `body`               |
| Connection failed                       | `FetchError` · `status: 0`, `code: 'NETWORK_ERROR'`                    |
| `signal` aborted                        | `AbortError` — not a `FetchError`, check with `isAbortError`           |
| `timeoutMs` elapsed                     | `TimeoutError` — not a `FetchError`, check with `isAbortError`         |

Interceptors' `onResponseError` (refresh-token, retry, status handlers) runs for every non-2xx response, even when its body is not valid JSON.

```ts
import { isAbortError, isFetchError } from 'tanstack-fetch'

try {
  await api.get('/slow', { timeoutMs: 5_000 })
} catch (error) {
  if (isAbortError(error)) {
    if ((error as Error).name === 'TimeoutError') {
      toast.error('Request timed out')
    }
    // plain AbortError = user cancelled — usually not worth a toast
  } else if (isFetchError(error)) {
    // HTTP or network failure
  }
}
```

## Status handlers (4xx + 5xx)

Handlers run **before** the error is thrown (Query still gets `isError` / `FetchError`):

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'

createFetch({
  onUnauthorized: () => logout(), // 401
  onForbidden: () => toast.error('Forbidden'), // 403
  onNotFound: () => toast.error('Missing'), // 404
  onTooManyRequests: ({ context }) => {
    const waitMs = parseRetryAfter(context.response?.headers, 1000)
    toast.error(`Rate limited — retry in ${Math.ceil(waitMs / 1000)}s`)
  },
  onClientError: ({ status }) => console.warn('4xx', status),
  onServerError: ({ status }) => console.error('5xx', status),
})
```

Full shortcut table: [Configuration](./configuration). Live demo: [playground](/examples/playground).

## With TanStack Query

```tsx
const { error } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get('/users', { signal }),
})

if (isFetchError(error) && error.status === 404) {
  return <p>Not found</p>
}

if (isFetchError(error) && error.status === 429) {
  return <p>Slow down — try again shortly</p>
}
```

## Helpers

| Helper                     | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `isFetchError(error)`      | Narrow to `FetchError`                        |
| `isAbortError(error)`      | Abort / timeout — usually not an HTTP failure |
| `createFetchError(result)` | Build a `FetchError` from a failed result     |
| `parseRetryAfter(headers)` | `Retry-After` → delay ms (for **429**)        |

## Related

- [Configuration](./configuration) · status handlers and interceptors
- [Plugins](./plugins) · `refresh-token`, `sse-resume`, custom interceptors
- [Refresh token](./refresh-token) · single-flight 401 refresh
- [Rate limit (429)](./rate-limit) · `parseRetryAfter` in practice
