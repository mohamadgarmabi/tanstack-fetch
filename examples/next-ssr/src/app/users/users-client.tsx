'use client'

import { useUsersClient } from './users.hook'

const UsersClient = () => {
  const { users, isPending, errorMessage } = useUsersClient()

  if (isPending) return <p>Loading…</p>
  if (errorMessage) return <p>{errorMessage}</p>

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}

export default UsersClient
export { UsersClient }
