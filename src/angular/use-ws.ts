import { DestroyRef, inject, signal, type Signal, type WritableSignal } from '@angular/core'
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
import { FETCH_CLIENT } from './fetch-token'

type UseWsOptionsBase<T> = WsOptions & {
  /** Client from `tanstack-fetch/live`. Prefer this over provideFetchClient. */
  client?: LiveFetchClient
  enabled?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: MessageEvent) => void
  onError?: (error: unknown) => void
}

type UseWsOptions<T, TPath extends string = string, TParams = NoParams> = UseWsOptionsBase<T> &
  LiveParams<TParams, TPath>

type UseWsResult<T, TSend> = {
  data: Signal<T | undefined>
  error: Signal<unknown>
  status: Signal<WsStatus>
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
  const contextClient = inject(FETCH_CLIENT, { optional: true })
  const destroyRef = inject(DestroyRef)
  const data: WritableSignal<T | undefined> = signal(undefined)
  const error: WritableSignal<unknown> = signal(undefined)
  const status: WritableSignal<WsStatus> = signal('disconnected')
  let socket: WsSocket<TSend> | null = null

  const stop = () => {
    socket?.close()
    socket = null
  }

  const api = options.client ?? contextClient
  if (options.enabled === false) {
    status.set('disconnected')
  } else if (!hasWs(api)) {
    status.set('error')
    error.set(
      new Error(
        'tanstack-fetch: useWs() needs a client from "tanstack-fetch/live" — pass { client: api } or provideFetchClient()',
      ),
    )
  } else {
    status.set('connecting')
    socket = api.ws<T, NoParams, TSend>(path, {
      ...(options as object),
      onOpen: () => status.set('connected'),
      onMessage: (message: T, event: MessageEvent) => {
        data.set(message)
        options.onMessage?.(message, event)
      },
      onError: (nextError: unknown) => {
        status.set('error')
        error.set(nextError)
        options.onError?.(nextError)
      },
      onReconnect: () => status.set('connecting'),
      onClose: () => status.set('disconnected'),
    } as never)
  }

  destroyRef.onDestroy(() => {
    stop()
    status.set('disconnected')
  })

  return {
    data,
    error,
    status,
    send: (message) => socket?.send(message),
    close: () => {
      stop()
      status.set('disconnected')
    },
  }
}

export { useWs }
export type { UseWsOptions, UseWsResult }
