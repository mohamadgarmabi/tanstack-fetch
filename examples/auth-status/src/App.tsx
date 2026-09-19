import { useAuthStatusApp } from './auth-status.hook'

const App = () => {
  const { profile, message } = useAuthStatusApp()

  if (message) return <p>{message}</p>
  if (!profile) return null

  return (
    <article>
      <h1>{profile.name}</h1>
      <p>{profile.email}</p>
    </article>
  )
}

export default App
export { App }
