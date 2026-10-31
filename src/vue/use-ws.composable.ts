import { inject, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import type {
  LiveFetchClient,
  FetchMethodPath,
  FetchParamsConstraint,
  LiveParams,
  NoParams,
  WsOptions,
  WsSocket,
  WsStatus,
} from 'tanstack-fetch'
import { fetchClientKey } from './fetch-key'

type UseWsOptionsBase<T> = WsOptions & {
  /** Client from `tanstack-fetch/live`. Prefer this over the Vue plugin. */
  client?: LiveFetchClient
  enabled?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: MessageEvent) => void
  onError?: (error: unknown) => void
}

type UseWsOptions<T, TPath extends string = string, TParams = NoParams> = UseWsOptionsBase<T> &
  LiveParams<TParams, TPath>

type UseWsResult<T, TSend> = {
  data: Ref<T | undefined>
  error: Ref<unknown>
  /** `connecting` → `connected` → `disconnected` | `error` */
  status: Ref<WsStatus>
  send: (data: TSend) => void
  close: () => void
}

const hasWs = (client: unknown): client is LiveFetchClient =>
  Boolean(client && typeof client === 'object' && 'ws' in client && typeof client.ws === 'function')

const useWs = <
  T,
  TParams extends FetchParamsConstraint = NoParams,
  TSend = unknown,
  TPath extends string = string,
>(
  path: FetchMethodPath<NoInfer<TParams>, TPath>,
  options: UseWsOptions<T, TPath, NoInfer<TParams>> = {} as UseWsOptions<
    T,
    TPath,
    NoInfer<TParams>
  >,
): UseWsResult<T, TSend> => {
  const contextClient = inject(fetchClientKey, null)
  const data = shallowRef<T | undefined>(undefined)
  const error = shallowRef<unknown>(undefined)
  const status = ref<WsStatus>('disconnected')
  let socket: WsSocket<TSend> | null = null

  const stop = () => {
    socket?.close()
    socket = null
  }

  const connect = () => {
    stop()

    if (options.enabled === false) {
      status.value = 'disconnected'
      return
    }

    const api = options.client ?? contextClient
    if (!hasWs(api)) {
      status.value = 'error'
      error.value = new Error(
        'tanstack-fetch: useWs() needs a client from "tanstack-fetch/live" — pass { client: api } or install createFetchPlugin',
      )
      return
    }

    error.value = undefined
    status.value = 'connecting'
    socket = api.ws<T, NoParams, TSend>(path, {
      ...(options as object),
      onOpen: () => {
        status.value = 'connected'
      },
      onMessage: (message: T, event: MessageEvent) => {
        data.value = message
        options.onMessage?.(message, event)
      },
      onError: (nextError: unknown) => {
        status.value = 'error'
        error.value = nextError
        options.onError?.(nextError)
      },
      onReconnect: () => {
        status.value = 'connecting'
      },
      onClose: () => {
        status.value = 'disconnected'
      },
    } as never)
  }

  watch(
    () => [
      options.client ?? contextClient,
      path,
      options.enabled,
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
    error,
    status,
    send: (message) => socket?.send(message),
    close: () => {
      stop()
      status.value = 'disconnected'
    },
  }
}

export { useWs }
export type { UseWsOptions, UseWsResult }
