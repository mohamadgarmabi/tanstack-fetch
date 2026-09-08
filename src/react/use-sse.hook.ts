import { useEffect, useRef, useState } from 'react'
import { isFetchError } from '../fetch-error'
import { useFetch } from './fetch-provider.hook'
import type { FetchError } from '../fetch-error'
import type { SseEvent } from '../types'

type UseSseOptions<T> = {
  /** When false, the stream is not opened. Default true. */
  enabled?: boolean
  lastEventId?: string
  params?: Record<string, string | number>
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: SseEvent<T>) => void
  onEvent?: (event: SseEvent<T>) => void
  onError?: (error: unknown) => void
}

type UseSseResult<T> = {
  data: T | undefined
  event: SseEvent<T> | undefined
  error: FetchError | Error | undefined
  isConnected: boolean
  close: () => void
}

const useSse = <T>(path: string, options: UseSseOptions<T> = {}): UseSseResult<T> => {
  const api = useFetch()
  const [data, setData] = useState<T | undefined>(undefined)
  const [event, setEvent] = useState<SseEvent<T> | undefined>(undefined)
  const [error, setError] = useState<FetchError | Error | undefined>(undefined)
  const [isConnected, setIsConnected] = useState(false)
  const closeRef = useRef<(() => void) | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const paramsKey = JSON.stringify(options.params ?? null)
  const queryKey = JSON.stringify(options.query ?? null)

  useEffect(() => {
    if (options.enabled === false) {
      return
    }

    setError(undefined)
    const subscription = api.sse<T>(path, {
      params: optionsRef.current.params,
      query: optionsRef.current.query,
      lastEventId: optionsRef.current.lastEventId,
      onOpen: () => setIsConnected(true),
      onMessage: (message, nextEvent) => {
        setData(message)
        setEvent(nextEvent)
        optionsRef.current.onMessage?.(message, nextEvent)
      },
      onEvent: (nextEvent) => {
        optionsRef.current.onEvent?.(nextEvent)
      },
      onError: (nextError) => {
        setIsConnected(false)
        const normalized =
          nextError instanceof Error ? nextError : new Error('SSE connection failed')
        setError(isFetchError(nextError) ? nextError : normalized)
        optionsRef.current.onError?.(nextError)
      },
      onClose: () => setIsConnected(false),
    })

    closeRef.current = subscription.close

    return () => {
      subscription.close()
      closeRef.current = null
      setIsConnected(false)
    }
  }, [api, path, options.enabled, options.lastEventId, paramsKey, queryKey])

  return {
    data,
    event,
    error,
    isConnected,
    close: () => closeRef.current?.(),
  }
}

export { useSse }
export type { UseSseOptions, UseSseResult }
