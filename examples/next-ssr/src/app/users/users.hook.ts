import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import { api } from '../../lib/api'
import type { User } from './users.type'

const usersQueryKey = ['users'] as const

const useUsersClient = () => {
  const { data, error, isPending } = useQuery({
    queryKey: usersQueryKey,
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })

  const errorMessage = isFetchError(error)
    ? `${error.status}: ${error.message}`
    : error
      ? 'Something went wrong'
      : ''

  return {
    users: data ?? [],
    isPending,
    errorMessage,
  }
}

export { useUsersClient, usersQueryKey }
