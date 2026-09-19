import { usePosts } from './posts.hook'

const App = () => {
  const { posts, statusMessage, isCreatePending, handleCreate } = usePosts()

  if (statusMessage) return <p>{statusMessage}</p>

  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <button type="button" onClick={handleCreate} disabled={isCreatePending}>
        Create post
      </button>
    </div>
  )
}

export default App
export { App }
