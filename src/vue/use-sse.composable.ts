import { inject, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { isFetchError } from 'tanstack-fetch'
import type {
  FetchClient,
  FetchError,
  SseEvent,
  SseStatus,
  FetchMethodPath,
  FetchParamsConstraint,
  LiveParams,
  NoParams,
} from 'tanstack-fetch'
import { fetchClientKey } from './fetch-key'

type UseSseOptionsBase<T> = {
  /** SSE client from `tanstack-fetch/sse`. Prefer this over the Vue plugin. */
  client?: FetchClient
  enabled?: boolean
  lastEventId?: string
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: SseEvent<T>) => void
  onEvent?: (event: SseEvent<T>) => void
  onError?: (error: unknown) => void
}

type UseSseOptions<T, TPath extends string = string, TParams = NoParams> = UseSseOptionsBase<T> &
  LiveParams<TParams, TPath>

type UseSseResult<T> = {
  data: Ref<T | undefined>
  event: Ref<SseEvent<T> | undefined>
  error: Ref<FetchError | Error | undefined>
  /** `connecting` → `connected` → `disconnected` | `error` */
  status: Ref<SseStatus>
  close: () => void
}

const hasSse = (client: unknown): client is FetchClient =>
  Boolean(
    client && typeof client === 'object' && 'sse' in client && typeof client.sse === 'function',
  )

const useSse = <T, TParams extends FetchParamsConstraint = NoParams, TPath extends string = string>(
  path: FetchMethodPath<NoInfer<TParams>, TPath>,
  options: UseSseOptions<T, TPath, NoInfer<TParams>> = {} as UseSseOptions<
    T,
    TPath,
    NoInfer<TParams>
  >,
): UseSseResult<T> => {
  const contextClient = inject(fetchClientKey, null)
  const data = shallowRef<T | undefined>(undefined)
  const event = shallowRef<SseEvent<T> | undefined>(undefined)
  const error = shallowRef<FetchError | Error | undefined>(undefined)
  const status = ref<SseStatus>('disconnected')
  let closeFn: (() => void) | null = null

  const stop = () => {
    closeFn?.()
    closeFn = null
  }

  const connect = () => {
    stop()

    if (options.enabled === false) {
      status.value = 'disconnected'
      return
    }

    const api = options.client ?? contextClient
    if (!hasSse(api)) {
      status.value = 'error'
      error.value = new Error(
        'tanstack-fetch: useSse() needs a client from "tanstack-fetch/sse" — pass { client: api } or install createFetchPlugin',
      )
      return
    }

    error.value = undefined
    status.value = 'connecting'

    const subscription = api.sse<T>(path, {
      ...(options as object),
      lastEventId: options.lastEventId,
      onOpen: () => {
        status.value = 'connected'
      },
      onMessage: (message: T, nextEvent: SseEvent<T>) => {
        data.value = message
        event.value = nextEvent
        options.onMessage?.(message, nextEvent)
      },
      onEvent: (nextEvent: SseEvent<T>) => {
        options.onEvent?.(nextEvent)
      },
      onError: (nextError: unknown) => {
        status.value = 'error'
        const normalized =
          nextError instanceof Error ? nextError : new Error('SSE connection failed')
        error.value = isFetchError(nextError) ? nextError : normalized
        options.onError?.(nextError)
      },
      onClose: () => {
        status.value = 'disconnected'
      },
    } as never)

    closeFn = subscription.close
  }

  watch(
    () => [
      options.client ?? contextClient,
      path,
      options.enabled,
      options.lastEventId,
      JSON.stringify('params' in options ? options.params : null),
      JSON.stringify(options.query ?? null),
    ],
    connect,
    { immediate: true },
  )

  onScopeDispose(() => {
    stop()
    status.value = 'disconnected'
  })

  return {
    data,
    event,
    error,
    status,
    close: () => {
      stop()
      status.value = 'disconnected'
    },
  }
}

export { useSse }
export type { UseSseOptions, UseSseResult }
