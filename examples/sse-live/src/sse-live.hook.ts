import { useState } from 'react'
import { useSse } from 'tanstack-fetch/react'
import type { OrderEvent } from './sse-live.type'

const useSseLiveApp = () => {
  const [events, setEvents] = useState<OrderEvent[]>([])
  const { isConnected, error, close } = useSse<OrderEvent>('/orders/stream', {
    onMessage: (data) => {
      setEvents((current) => [data, ...current].slice(0, 20))
    },
  })

  const errorMessage = error ? error.message : ''
  const statusLabel = isConnected ? 'Live' : 'Connecting…'

  return { events, errorMessage, statusLabel, close }
}

export { useSseLiveApp }
