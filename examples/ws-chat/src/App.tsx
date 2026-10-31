import { useState } from 'react'
import { useWsChatApp } from './ws-chat.hook'

const App = () => {
  const [draft, setDraft] = useState('')
  const { messages, statusLabel, send, close, ask, answerText, answering } = useWsChatApp('general')

  return (
    <div>
      <header>
        <h1>#general</h1>
        <p>{statusLabel}</p>
        <button type="button" onClick={close}>
          Leave
        </button>
      </header>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>
            <strong>{message.user}</strong>: {message.text}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          send(draft)
          setDraft('')
        }}
      >
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button type="submit">Send</button>
        <button type="button" onClick={() => ask(draft)}>
          Ask AI
        </button>
      </form>
      {answerText ? (
        <p>
          {answerText}
          {answering ? '▍' : ''}
        </p>
      ) : null}
    </div>
  )
}

export default App
export { App }
