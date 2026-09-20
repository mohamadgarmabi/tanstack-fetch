import { useEffect, useRef, useState } from 'react'
import { isFetchError } from 'tanstack-fetch'
import type { FetchError, FetchClient, SseEvent, WithPathParams } from 'tanstack-fetch'
import { useFetch } from './fetch-provider.hook'

type UseSseOptionsBase<T> = {
  enabled?: boolean
  lastEventId?: string
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: SseEvent<T>) => void
  onEvent?: (event: SseEvent<T>) => void
  onError?: (error: unknown) => void
}

type UseSseOptions<T, TPath extends string = string> = UseSseOptionsBase<T> & WithPathParams<TPath>

type UseSseResult<T> = {
  data: T | undefined
  event: SseEvent<T> | undefined
  error: FetchError | Error | undefined
  isConnected: boolean
  close: () => void
}

const hasSse = (client: unknown): client is FetchClient =>
  Boolean(
    client && typeof client === 'object' && 'sse' in client && typeof client.sse === 'function',
  )

const useSse = <T, TPath extends string = string>(
  path: TPath,
  options: UseSseOptions<T, TPath> = {} as UseSseOptions<T, TPath>,
): UseSseResult<T> => {
  const api = useFetch()
  const [data, setData] = useState<T | undefined>(undefined)
  const [event, setEvent] = useState<SseEvent<T> | undefined>(undefined)
  const [error, setError] = useState<FetchError | Error | undefined>(undefined)
  const [isConnected, setIsConnected] = useState(false)
  const closeRef = useRef<(() => void) | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const paramsKey = JSON.stringify('params' in options ? options.params : null)
  const queryKey = JSON.stringify(options.query ?? null)

  useEffect(() => {
    if (options.enabled === false) {
      return
    }
    if (!hasSse(api)) {
      setError(
        new Error(
          'tanstack-fetch: useSse() needs a client from "tanstack-fetch/sse" (pass client to FetchProvider)',
        ),
      )
      return
    }

    setError(undefined)
    const subscription = api.sse<T, TPath>(path, {
      ...(optionsRef.current as UseSseOptions<T, TPath>),
      lastEventId: optionsRef.current.lastEventId,
      onOpen: () => setIsConnected(true),
      onMessage: (message: T, nextEvent: SseEvent<T>) => {
        setData(message)
        setEvent(nextEvent)
        optionsRef.current.onMessage?.(message, nextEvent)
      },
      onEvent: (nextEvent: SseEvent<T>) => {
        optionsRef.current.onEvent?.(nextEvent)
      },
      onError: (nextError: unknown) => {
        setIsConnected(false)
        const normalized =
          nextError instanceof Error ? nextError : new Error('SSE connection failed')
        setError(isFetchError(nextError) ? nextError : normalized)
        optionsRef.current.onError?.(nextError)
      },
      onClose: () => setIsConnected(false),
    } as never)

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
