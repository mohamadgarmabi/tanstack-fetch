# TanStack Query

![useQuery, queryOptions, and useMutation with createFetch](/images/docs-tanstack-query.png)

## Shared `queryOptions`

```ts
// src/queries/users.ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '../lib/api'

type User = { id: string; name: string }

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.get<User>('/users/:id', { params: { id }, signal }),
  })
```

```tsx
import { useQuery } from '@tanstack/react-query'
import { usersQueryOptions } from '../queries/users'

const { data } = useQuery(usersQueryOptions)
```

## Params + `enabled`

```tsx
const { data, error, isPending } = useQuery({
  queryKey: ['users', userId],
  enabled: Boolean(userId),
  queryFn: ({ signal }) =>
    api.get<User>('/users/:id', {
      params: { id: userId! },
      signal,
    }),
})
```

## Mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const queryClient = useQueryClient()

const createUser = useMutation({
  mutationFn: (body: { name: string; email: string }) => api.post('/users', { body }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

## Always pass `signal`

```ts
queryFn: ({ signal }) => api.get('/users', { signal })
```

Cancel / unmount / query-key changes abort the request cleanly without treating abort as a failed HTTP response.

Copy-paste app: [`examples/tanstack-query`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query)
