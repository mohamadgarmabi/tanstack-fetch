import { onDestroy } from 'svelte'
import { writable, type Readable } from 'svelte/store'
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
import { getContextFetchClient } from './set-fetch-client'

type UseWsOptionsBase<T> = WsOptions & {
  /** Client from `tanstack-fetch/live`. Prefer this over setFetchClient. */
  client?: LiveFetchClient
  enabled?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  onMessage?: (data: T, event: MessageEvent) => void
  onError?: (error: unknown) => void
}

type UseWsOptions<T, TPath extends string = string, TParams = NoParams> = UseWsOptionsBase<T> &
  LiveParams<TParams, TPath>

type UseWsResult<T, TSend> = {
  data: Readable<T | undefined>
  error: Readable<unknown>
  status: Readable<WsStatus>
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
  const data = writable<T | undefined>(undefined)
  const error = writable<unknown>(undefined)
  const status = writable<WsStatus>('disconnected')
  let socket: WsSocket<TSend> | null = null

  const stop = () => {
    socket?.close()
    socket = null
  }

  const api = options.client ?? getContextFetchClient()
  if (options.enabled === false) {
    status.set('disconnected')
  } else if (!hasWs(api)) {
    status.set('error')
    error.set(
      new Error(
        'tanstack-fetch: useWs() needs a client from "tanstack-fetch/live" — pass { client: api } or call setFetchClient()',
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
