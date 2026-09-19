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
  }
}
```

## With TanStack Query

```tsx
const { error } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get('/users', { signal }),
})

if (isFetchError(error) && error.status === 404) {
  return <p>Not found</p>
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
