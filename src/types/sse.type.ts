type SseEvent<T = unknown> = {
  event?: string
  data: T
  id?: string
  retry?: number
}

type SseOptions = {
  lastEventId?: string
  onEvent?: (event: SseEvent<unknown>) => void
}

export type { SseEvent, SseOptions }
