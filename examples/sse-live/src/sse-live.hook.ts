import { useState } from 'react'
import { useSse } from 'tanstack-fetch/react'
import { api } from './lib/api'
import type { OrderEvent } from './sse-live.type'

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  connected: 'Live',
  disconnected: 'Disconnected',
  error: 'Error',
}

const useSseLiveApp = () => {
  const [events, setEvents] = useState<OrderEvent[]>([])
  const { status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
    onMessage: (data) => {
      setEvents((current) => [data, ...current].slice(0, 20))
    },
  })

  const errorMessage = error ? error.message : ''
  const statusLabel = STATUS_LABEL[status] ?? status

  return { events, errorMessage, statusLabel, status, close }
}

export { useSseLiveApp }
