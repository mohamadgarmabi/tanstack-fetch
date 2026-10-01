import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { createServerApi } from '../../lib/api'
import UsersClient from './users-client'
import { usersQueryKey } from './users.hook'
import type { User } from './users.type'

const UsersPage = async () => {
  const api = await createServerApi()
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: usersQueryKey,
    queryFn: () => api.get<User[]>('/users'),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient />
    </HydrationBoundary>
  )
}

export default UsersPage
