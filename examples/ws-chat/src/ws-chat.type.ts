type ChatMessage = {
  id: string
  user: string
  text: string
}

type OutgoingMessage = {
  text: string
}

type AnswerChunk = {
  text: string
}

export type { AnswerChunk, ChatMessage, OutgoingMessage }
