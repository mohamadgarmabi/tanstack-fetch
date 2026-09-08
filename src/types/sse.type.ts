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
  onOpen?: () => void
  onError?: (error: unknown) => void
  onClose?: () => void
}

export type { SseEvent, SseSubscription, SseHandlers }
