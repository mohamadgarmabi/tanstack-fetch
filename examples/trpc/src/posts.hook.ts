import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trpc } from './lib/trpc'

const usePosts = () => {
  const queryClient = useQueryClient()
  const listQuery = useQuery(trpc.post.list.queryOptions())

  const createPost = useMutation({
    ...trpc.post.create.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.post.list.queryFilter())
    },
  })

  const handleCreate = () => {
    createPost.mutate({ title: 'New post from tanstack-fetch' })
  }

  const statusMessage = listQuery.isPending
    ? 'Loading…'
    : listQuery.isError
      ? listQuery.error.message
      : ''

  const posts = listQuery.data ?? []
  const isCreatePending = createPost.isPending

  return {
    posts,
    statusMessage,
    isCreatePending,
    handleCreate,
  }
}

export { usePosts }
