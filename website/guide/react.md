# React

Optional helpers from `tanstack-fetch/react`.

## `FetchProvider`

```tsx
import { FetchProvider, useFetch } from 'tanstack-fetch/react'
import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'

const App = () => (
  <FetchProvider
    baseUrl={import.meta.env.VITE_API_URL}
    getToken={() => localStorage.getItem('access_token')}
    onUnauthorized={() => {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }}
    plugins={['trace', 'retry-idempotent']}
  >
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const api = useFetch()
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error))
    return (
      <p>
        {error.status}: {error.message}
      </p>
    )
  return (
    <ul>
      {data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}
```

Or pass an existing client:

```tsx
const api = createFetch({ baseUrl: '…', getToken: … })

<FetchProvider client={api}>
  <App />
</FetchProvider>
```

## `useSse`

Requires a client from `tanstack-fetch/sse`. See [SSE](./sse).
