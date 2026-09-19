# tanstack-fetch + TanStack Query

Minimal copy-paste example: shared client, `queryOptions`, and a page that uses `useQuery` / `useMutation`.

Source files live under [`src/`](./src):

- [`src/lib/api.ts`](./src/lib/api.ts) — `createFetch` client
- [`src/queries/users.ts`](./src/queries/users.ts) — shared `queryOptions`
- [`src/App.tsx`](./src/App.tsx) — `useQuery` + `useMutation`

## Install

```bash
npm install tanstack-fetch @tanstack/react-query
```

## Files

### `src/lib/api.ts`

```ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://jsonplaceholder.typicode.com',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
  plugins: ['trace', 'retry-idempotent'],
})
```

### `src/queries/users.ts`

```ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '../lib/api'

export type User = { id: number; name: string; email: string }

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

export const userQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.get<User>('/users/:id', { params: { id }, signal }),
  })
```

### `src/App.tsx`

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import { api } from './lib/api'
import { usersQueryOptions } from './queries/users'

export const App = () => {
  const queryClient = useQueryClient()
  const { data, error, isPending } = useQuery(usersQueryOptions)

  const createUser = useMutation({
    mutationFn: (body: { name: string; email: string }) => api.post('/users', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error))
    return (
      <p>
        {error.status}: {error.message}
      </p>
    )
  if (error) return <p>Something went wrong</p>

  return (
    <div>
      <ul>
        {data.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => createUser.mutate({ name: 'Ada', email: 'ada@example.com' })}
      >
        Create
      </button>
    </div>
  )
}
```

### Provider

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { App } from './App'

export const Root = () => {
  const [client] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  )
}
```

## Why this shape?

- `queryFn` returns data and throws `FetchError` — matches TanStack Query
- Pass `{ signal }` so cancel/unmount works
- Share `queryOptions` between components, prefetch, and SSR

See also: [refresh-token interceptor](../docs/recipes/refresh-token.md) · [npm package](https://www.npmjs.com/package/tanstack-fetch)
