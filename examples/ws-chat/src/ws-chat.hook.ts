import { useState } from 'react'
import { experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query'
import { useWs } from 'tanstack-fetch/react'
import { api } from './lib/api'
import type { AnswerChunk, ChatMessage, OutgoingMessage } from './ws-chat.type'

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  connected: 'Live',
  disconnected: 'Disconnected',
  error: 'Error',
}

const useWsChatApp = (roomId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')

  const { status, send, close } = useWs<ChatMessage, { id: string }, OutgoingMessage>(
    '/rooms/:id',
    {
      client: api,
      params: { id: roomId },
      authIn: 'query',
      onMessage: (message) => setMessages((current) => [...current, message].slice(-50)),
    },
  )

  // NDJSON: one JSON object per line, rendered as it arrives.
  const answer = useQuery({
    queryKey: ['answer', prompt],
    queryFn: streamedQuery({
      streamFn: ({ signal }) =>
        api.stream<AnswerChunk, { id: string }>('/rooms/:id/ask', {
          params: { id: roomId },
          body: { prompt },
          signal,
        }),
    }),
    enabled: prompt.length > 0,
  })

  return {
    messages,
    statusLabel: STATUS_LABEL[status] ?? status,
    send: (text: string) => send({ text }),
    close,
    ask: setPrompt,
    answerText: (answer.data ?? []).map((chunk) => chunk.text).join(''),
    answering: answer.fetchStatus === 'fetching',
  }
}

export { useWsChatApp }
