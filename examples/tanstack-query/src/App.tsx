import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import { api } from './lib/api'
import { usersQueryOptions } from './queries/users'

const App = () => {
  const queryClient = useQueryClient()
  const { data, error, isPending } = useQuery(usersQueryOptions)

  const createUser = useMutation({
    mutationFn: (body: { name: string; email: string }) => api.post('/users', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error)) {
    return (
      <p>
        {error.status}: {error.message}
      </p>
    )
  }
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

export default App
export { App }
