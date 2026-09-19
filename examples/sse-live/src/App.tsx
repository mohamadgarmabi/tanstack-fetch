import { useSseLiveApp } from './sse-live.hook'

const App = () => {
  const { events, errorMessage, statusLabel, close } = useSseLiveApp()

  return (
    <div>
      <header>
        <h1>Orders stream</h1>
        <p>{statusLabel}</p>
        <button type="button" onClick={close}>
          Disconnect
        </button>
      </header>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <ul>
        {events.map((item) => (
          <li key={item.id}>
            {item.id}: {item.status}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
export { App }
