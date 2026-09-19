import { createFetch, isFetchError } from 'tanstack-fetch'

type User = { id: number; name: string; email?: string }

const api = createFetch({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  plugins: ['trace', 'retry-idempotent'],
})

const main = async () => {
  const users = await api.get<User[]>('/users', { query: { _limit: 3 } })
  console.log(
    'users',
    users.map((user) => user.name),
  )

  const created = await api.post<User>('/users', {
    body: { name: 'Ada', email: 'ada@example.com' },
  })
  console.log('created', created.id, created.name)

  try {
    await api.get('/does-not-exist-404')
  } catch (error) {
    if (isFetchError(error)) {
      console.log('typed error', error.status, error.code, error.message)
    }
  }
}

void main()

export { api, main }
export type { User }
