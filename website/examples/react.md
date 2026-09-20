---
title: React Query live demo
description: Live createFetch demo matching TanStack Query useQuery and useMutation.
---

# React / TanStack Query

Same contract as your React app: **return data, throw on error, honor `signal`**.

<ReactQueryDemo />

## In your app

```tsx
import { createFetch, isFetchError } from 'tanstack-fetch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const api = createFetch({ baseUrl: import.meta.env.VITE_API_URL })

const UsersPage = () => {
  const queryClient = useQueryClient()
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })
  const createUser = useMutation({
    mutationFn: (body: { name: string }) => api.post<User>('/users', { body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error)) return <p>{error.status}: {error.message}</p>
  return (
    <ul>
      {data.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  )
}
```

Optional context: [React FetchProvider](/guide/react) · repo example: [`examples/tanstack-query`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query)
