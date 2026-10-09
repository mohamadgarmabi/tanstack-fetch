import { onDestroy } from 'svelte'
import { writable, type Readable } from 'svelte/store'
import { isFetchError } from 'tanstack-fetch'
import type { FetchClient, FetchError, SseEvent, SseStatus, WithPathParams } from 'tanstack-fetch'
import { getContextFetchClient } from './set-fetch-client'

type UseSseOptionsBase<T> = {
  /** SSE client from `tanstack-fetch/sse`. Prefer this over setFetchClient. */
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
  data: Readable<T | undefined>
  event: Readable<SseEvent<T> | undefined>
  error: Readable<FetchError | Error | undefined>
  status: Readable<SseStatus>
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
  const data = writable<T | undefined>(undefined)
  const event = writable<SseEvent<T> | undefined>(undefined)
  const error = writable<FetchError | Error | undefined>(undefined)
  const status = writable<SseStatus>('disconnected')
  let closeFn: (() => void) | null = null

  const stop = () => {
    closeFn?.()
    closeFn = null
  }

  const connect = () => {
    stop()

    if (options.enabled === false) {
      status.set('disconnected')
      return
    }

    const api = options.client ?? getContextFetchClient()
    if (!hasSse(api)) {
      status.set('error')
      error.set(
        new Error(
          'tanstack-fetch: useSse() needs a client from "tanstack-fetch/sse" — pass { client: api } or call setFetchClient()',
        ),
      )
      return
    }

    error.set(undefined)
    status.set('connecting')

    const subscription = api.sse<T, TPath>(path, {
      ...(options as UseSseOptions<T, TPath>),
      lastEventId: options.lastEventId,
      onOpen: () => status.set('connected'),
      onMessage: (message: T, nextEvent: SseEvent<T>) => {
        data.set(message)
        event.set(nextEvent)
        options.onMessage?.(message, nextEvent)
      },
      onEvent: (nextEvent: SseEvent<T>) => {
        options.onEvent?.(nextEvent)
      },
      onError: (nextError: unknown) => {
        status.set('error')
        const normalized =
          nextError instanceof Error ? nextError : new Error('SSE connection failed')
        error.set(isFetchError(nextError) ? nextError : normalized)
        options.onError?.(nextError)
      },
      onClose: () => status.set('disconnected'),
    } as never)

    closeFn = subscription.close
  }

  connect()

  try {
    onDestroy(() => {
      stop()
      status.set('disconnected')
    })
  } catch {
    // Outside a Svelte component (e.g. unit tests) — caller must close().
  }

  return {
    data,
    event,
    error,
    status,
    close: () => {
      stop()
      status.set('disconnected')
    },
  }
}

export { useSse }
export type { UseSseOptions, UseSseResult }
