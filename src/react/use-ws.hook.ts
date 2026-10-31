import { useContext, useEffect, useRef, useState } from 'react'
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
import { FetchContext } from './fetch-provider.hook'

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
  /** Last received message. */
  data: T | undefined
  error: unknown
  /** `connecting` → `connected` → `disconnected` | `error` */
  status: WsStatus
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
  const api = options.client ?? contextClient
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<unknown>(undefined)
  const [status, setStatus] = useState<WsStatus>('disconnected')
  const socketRef = useRef<WsSocket<TSend> | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const paramsKey = JSON.stringify('params' in options ? options.params : null)
  const queryKey = JSON.stringify(options.query ?? null)

  useEffect(() => {
    if (options.enabled === false) {
      setStatus('disconnected')
      return
    }
    if (!hasWs(api)) {
      setStatus('error')
      setError(
        new Error(
          'tanstack-fetch: useWs() needs a client from "tanstack-fetch/live" — pass { client: api } or wrap with <FetchProvider client={api}>',
        ),
      )
      return
    }

    setError(undefined)
    setStatus('connecting')
    const socket = api.ws<T, NoParams, TSend>(path, {
      ...(optionsRef.current as object),
      onOpen: () => setStatus('connected'),
      onMessage: (message: T, event: MessageEvent) => {
        setData(message)
        optionsRef.current.onMessage?.(message, event)
      },
      onError: (nextError: unknown) => {
        setStatus('error')
        setError(nextError)
        optionsRef.current.onError?.(nextError)
      },
      onReconnect: () => setStatus('connecting'),
      onClose: () => setStatus('disconnected'),
    } as never)
    socketRef.current = socket

    return () => {
      socket.close()
      socketRef.current = null
      setStatus('disconnected')
    }
  }, [api, path, options.enabled, paramsKey, queryKey])

  return {
    data,
    error,
    status,
    send: (message) => socketRef.current?.send(message),
    close: () => socketRef.current?.close(),
  }
}

export { useWs }
export type { UseWsOptions, UseWsResult }
