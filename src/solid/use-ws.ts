import { createSignal, onCleanup, useContext } from 'solid-js'
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
import { FetchContext } from './fetch-context'

type UseWsOptionsBase<T> = WsOptions & {
  /** Client from `tanstack-fetch/live`. Prefer this over FetchProvider. */
  client?: LiveFetchClient
  enabled?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: MessageEvent) => void
  onError?: (error: unknown) => void
}

type UseWsOptions<T, TPath extends string = string, TParams = NoParams> = UseWsOptionsBase<T> &
  LiveParams<TParams, TPath>

type UseWsResult<T, TSend> = {
  data: () => T | undefined
  error: () => unknown
  /** `connecting` → `connected` → `disconnected` | `error` */
  status: () => WsStatus
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
  const contextClient = useContext(FetchContext)
  const [data, setData] = createSignal<T | undefined>(undefined)
  const [error, setError] = createSignal<unknown>(undefined)
  const [status, setStatus] = createSignal<WsStatus>('disconnected')
  let socket: WsSocket<TSend> | null = null

  const stop = () => {
    socket?.close()
    socket = null
  }

  const api = options.client ?? contextClient
  if (options.enabled === false) {
    setStatus('disconnected')
  } else if (!hasWs(api)) {
    setStatus('error')
    setError(
      () =>
        new Error(
          'tanstack-fetch: useWs() needs a client from "tanstack-fetch/live" — pass { client: api } or wrap with <FetchProvider client={api}>',
        ),
    )
  } else {
    setStatus('connecting')
    socket = api.ws<T, NoParams, TSend>(path, {
      ...(options as object),
      onOpen: () => setStatus('connected'),
      onMessage: (message: T, event: MessageEvent) => {
        setData(() => message)
        options.onMessage?.(message, event)
      },
      onError: (nextError: unknown) => {
        setStatus('error')
        setError(() => nextError)
        options.onError?.(nextError)
      },
      onReconnect: () => setStatus('connecting'),
      onClose: () => setStatus('disconnected'),
    } as never)
  }

  onCleanup(() => {
    stop()
    setStatus('disconnected')
  })

  return {
    data,
    error,
    status,
    send: (message) => socket?.send(message),
    close: () => {
      stop()
      setStatus('disconnected')
    },
  }
}

export { useWs }
export type { UseWsOptions, UseWsResult }
