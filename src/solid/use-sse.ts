import { createSignal, onCleanup, useContext } from 'solid-js'
import { isFetchError } from 'tanstack-fetch'
import type { FetchClient, FetchError, SseEvent, SseStatus, WithPathParams } from 'tanstack-fetch'
import { FetchContext } from './fetch-context'

type UseSseOptionsBase<T> = {
  /** SSE client from `tanstack-fetch/sse`. Prefer this over FetchProvider. */
  client?: FetchClient
  enabled?: boolean
  lastEventId?: string
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: SseEvent<T>) => void
  onEvent?: (event: SseEvent<T>) => void
  onError?: (error: unknown) => void
}

type UseSseOptions<T, TPath extends string = string> = UseSseOptionsBase<T> & WithPathParams<TPath>

type UseSseResult<T> = {
  data: () => T | undefined
  event: () => SseEvent<T> | undefined
  error: () => FetchError | Error | undefined
  /** `connecting` → `connected` → `disconnected` | `error` */
  status: () => SseStatus
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
  const contextClient = useContext(FetchContext)
  const [data, setData] = createSignal<T | undefined>(undefined)
  const [event, setEvent] = createSignal<SseEvent<T> | undefined>(undefined)
  const [error, setError] = createSignal<FetchError | Error | undefined>(undefined)
  const [status, setStatus] = createSignal<SseStatus>('disconnected')
  let closeFn: (() => void) | null = null

  const stop = () => {
    closeFn?.()
    closeFn = null
  }

  const connect = () => {
    stop()

    if (options.enabled === false) {
      setStatus('disconnected')
      return
    }

    const api = options.client ?? contextClient
    if (!hasSse(api)) {
      setStatus('error')
      setError(
        new Error(
          'tanstack-fetch: useSse() needs a client from "tanstack-fetch/sse" — pass { client: api } or wrap with <FetchProvider client={api}>',
        ),
      )
      return
    }

    setError(undefined)
    setStatus('connecting')

    const subscription = api.sse<T, TPath>(path, {
      ...(options as UseSseOptions<T, TPath>),
      lastEventId: options.lastEventId,
      onOpen: () => setStatus('connected'),
      onMessage: (message: T, nextEvent: SseEvent<T>) => {
        setData(() => message)
        setEvent(() => nextEvent)
        options.onMessage?.(message, nextEvent)
      },
      onEvent: (nextEvent: SseEvent<T>) => {
        options.onEvent?.(nextEvent)
      },
      onError: (nextError: unknown) => {
        setStatus('error')
        const normalized =
          nextError instanceof Error ? nextError : new Error('SSE connection failed')
        setError(() => (isFetchError(nextError) ? nextError : normalized))
        options.onError?.(nextError)
      },
      onClose: () => setStatus('disconnected'),
    } as never)

    closeFn = subscription.close
  }

  connect()

  onCleanup(() => {
    stop()
    setStatus('disconnected')
  })

  return {
    data,
    event,
    error,
    status,
    close: () => {
      stop()
      setStatus('disconnected')
    },
  }
}

export { useSse }
export type { UseSseOptions, UseSseResult }
