# Errors

![FetchError with status, code, message, body](/images/docs-errors.png)

By default (`throwOnError: true`) failed HTTP calls throw a **`FetchError`**.

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

## Opt into `FetchResult`

```ts
const result = await api.get<User>('/users/1', { throwOnError: false })
if (!result.ok) {
  console.log(result.error)
} else {
  console.log(result.data)
}
```

## Helpers

| Helper                     | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `isFetchError(error)`      | Narrow to `FetchError`                        |
| `isAbortError(error)`      | Abort / timeout — usually not an HTTP failure |
| `createFetchError(result)` | Build a `FetchError` from a failed result     |
| `parseRetryAfter(headers)` | `Retry-After` → delay ms (for **429**)        |
