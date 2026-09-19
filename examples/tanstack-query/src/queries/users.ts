import { queryOptions } from '@tanstack/react-query'
import { api } from '../lib/api'

type User = { id: number; name: string; email: string }

const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

const userQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.get<User>('/users/:id', { params: { id }, signal }),
  })

export { usersQueryOptions, userQueryOptions }
export type { User }
