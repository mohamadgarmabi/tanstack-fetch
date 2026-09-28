type SseStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

type SseEvent<T = unknown> = {
  event?: string
  data: T
  id?: string
  retry?: number
}

type SseSubscription = {
  /** Stop the stream. */
  close: () => void
}

type SseHandlers<T = unknown> = {
  /** Simple path — only the payload. */
  onMessage?: (data: T, event: SseEvent<T>) => void
  /** Full SSE event (`event`, `data`, `id`). */
  onEvent?: (event: SseEvent<T>) => void
  /** Fired when the stream is open (response OK), not when subscribe() is called. */
  onOpen?: () => void
  onError?: (error: unknown) => void
  onClose?: () => void
}

export type { SseStatus, SseEvent, SseSubscription, SseHandlers }
