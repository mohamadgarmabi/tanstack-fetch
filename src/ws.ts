import type {
  CreateFetchOptions,
  CreateWebSocket,
  FetchErrorInfo,
  FetchResult,
  HttpInterceptor,
  LiveMessageContext,
  RequestContext,
  WsCallOptions,
  WsSocket,
} from './types'
import { createFetchError } from './fetch-error'
import { resolveInterceptors, runHook } from './interceptors/run-interceptors'
import { createSseContext } from './sse-context'
import { createLiveId } from './utils/live-id'
import { toFetchErrorInfo } from './utils/result'
import { defaultCreateWebTransport, webTransportAsSocket } from './webtransport'

type WsBase = {
  client: CreateFetchOptions
  interceptors: HttpInterceptor[]
}

const MAX_RECONNECT_DELAY_MS = 30_000

const defaultCreateWebSocket: CreateWebSocket = (url, { protocols, headers }) =>
  Object.keys(headers).length > 0
    ? // Non-standard init accepted by Node 22+ (undici), Bun and Deno.
      new WebSocket(url, { protocols, headers } as never)
    : new WebSocket(url, protocols)

/** Browser windows and workers cannot set WebSocket headers. */
const isBrowserLike = () =>
  typeof document !== 'undefined' ||
  typeof (globalThis as { WorkerGlobalScope?: unknown }).WorkerGlobalScope !== 'undefined'

const isRawFrame = (data: unknown) =>
  typeof data === 'string' ||
  data instanceof ArrayBuffer ||
  ArrayBuffer.isView(data) ||
  (typeof Blob !== 'undefined' && data instanceof Blob)

const parseFrame = (data: unknown, parseAs?: string) => {
  if (typeof data !== 'string' || parseAs === 'text') return data
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

const stripScheme = (value: string, scheme: string) =>
  scheme && value.startsWith(`${scheme} `) ? value.slice(scheme.length + 1) : value

const detach = (socket: WebSocket) => {
  socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null
}

const openWs = <TMessage, TSend>(
  base: WsBase,
  path: string,
  options: WsCallOptions<TMessage> = {},
): WsSocket<TSend> => {
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    onReconnect,
    protocols,
    transport = 'websocket',
    webTransport,
    authIn = transport === 'websocket' && !isBrowserLike() ? 'header' : undefined,
    authQueryKey = 'token',
    reconnect = true,
    ...requestOptions
  } = options
  const interceptors = resolveInterceptors(base.interceptors, requestOptions.interceptors)
  const createWebSocket =
    transport === 'webtransport'
      ? webTransportAsSocket(
          base.client.createWebTransport ?? defaultCreateWebTransport,
          webTransport,
        )
      : (base.client.createWebSocket ?? defaultCreateWebSocket)
  const retries = reconnect === false ? 0 : ((reconnect === true ? {} : reconnect).retries ?? 5)
  const delayMs = (reconnect === true || reconnect === false ? {} : reconnect).delayMs ?? 1000
  // buildUrl only knows http(s); map absolute ws(s) paths there and back.
  const httpPath = path.replace(/^ws(s?):\/\//i, 'http$1://')
  const queue: unknown[] = []
  let socket: WebSocket | undefined
  let attempt = 0
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined
  // Interceptor context of the current connection, for the onLive* hooks (DevTools, logging).
  const liveId = createLiveId()
  let live: RequestContext | undefined
  let liveClosed = true

  const emitMessage = (direction: 'in' | 'out', data: unknown) => {
    if (!live) return
    const context: LiveMessageContext = { ...live, message: { direction, data } }
    void runHook(interceptors, (item) => item.onLiveMessage, context).catch(() => undefined)
  }

  const closeLive = (error?: FetchErrorInfo) => {
    if (!live || liveClosed) return
    liveClosed = true
    const context = error ? { ...live, error } : live
    void runHook(interceptors, (item) => item.onLiveClose, context).catch(() => undefined)
  }

  const transmit = (target: WebSocket, frame: unknown) => {
    target.send(frame as never)
    emitMessage('out', parseFrame(frame, requestOptions.parseAs))
  }

  /** Single exit: runs once, drops the old socket's handlers so no stale event leaks out. */
  const finish = (event?: CloseEvent) => {
    if (stopped) return
    stopped = true
    clearTimeout(timer)
    requestOptions.signal?.removeEventListener('abort', abort)
    queue.length = 0
    if (socket) detach(socket)
    closeLive()
    onClose?.(event)
  }

  const scheduleReconnect = (event?: CloseEvent) => {
    if (stopped) return
    if (attempt >= retries) {
      finish(event)
      return
    }
    attempt += 1
    onReconnect?.(attempt)
    timer = setTimeout(connect, Math.min(delayMs * 2 ** (attempt - 1), MAX_RECONNECT_DELAY_MS))
  }

  const connect = async () => {
    try {
      let context = await createSseContext(
        { path: httpPath, requestOptions, client: base.client, interceptors },
        attempt,
        undefined,
        { accept: null },
      )
      context.meta.transport = transport
      context.meta.requestId = liveId
      const before = await runHook(interceptors, (item) => item.onRequest, context)
      if (before.type === 'short-circuit') {
        const result = before.result as FetchResult<unknown, FetchErrorInfo>
        if (!result.ok) throw createFetchError(result as FetchResult<never, FetchErrorInfo>)
        finish()
        return
      }
      if (before.type === 'retry') {
        scheduleReconnect()
        return
      }
      if (before.type === 'continue') context = before.context
      if (stopped) return

      const url = new URL(context.request.url)
      if (transport === 'websocket') url.protocol = url.protocol.replace(/^http/, 'ws')
      const list = protocols === undefined ? [] : [protocols].flat()
      const headers: Record<string, string> = {}
      if (authIn === 'header') {
        context.request.headers.forEach((value, key) => (headers[key] = value))
      } else {
        const auth = base.client.auth
        const value = context.request.headers.get(auth?.header ?? 'authorization')
        const token = value && stripScheme(value, auth?.scheme ?? 'Bearer')
        if (token && !authIn) {
          // Never put a token in a URL / subprotocol without the caller opting in. Config error: no retry.
          onError?.(
            new Error(
              "tanstack-fetch: this runtime cannot send connection headers — set authIn: 'query' or 'protocol'",
            ),
          )
          finish()
          return
        }
        if (token && authIn === 'query') url.searchParams.set(authQueryKey, token)
        if (token && authIn === 'protocol') list.push(token)
      }

      const next = createWebSocket(url.toString(), {
        protocols: list.length > 0 ? list : undefined,
        headers,
      })
      socket = next
      live = context
      liveClosed = false
      next.onopen = (event) => {
        attempt = 0
        void runHook(interceptors, (item) => item.onLiveOpen, context).catch(() => undefined)
        queue.splice(0).forEach((frame) => transmit(next, frame))
        onOpen?.(event)
      }
      next.onmessage = (event) => {
        const data = parseFrame(event.data, requestOptions.parseAs)
        emitMessage('in', data)
        onMessage?.(data as TMessage, event)
      }
      next.onerror = (event) => onError?.(event)
      next.onclose = (event) => {
        detach(next)
        socket = undefined
        closeLive(
          event.code === 1000
            ? undefined
            : toFetchErrorInfo(0, {
                code: 'LIVE_CLOSED',
                message: `connection closed with code ${event.code}`,
              }),
        )
        if (event.code === 1000) finish(event)
        else scheduleReconnect(event)
      }
    } catch (error) {
      if (stopped) return
      onError?.(error)
      // Auth / interceptor failures during a reconnect still use the retry budget.
      scheduleReconnect()
    }
  }

  const close = (code = 1000, reason?: string) => {
    if (stopped) return
    const current = socket
    finish()
    if (current && current.readyState <= 1) current.close(code, reason)
  }
  const abort = () => close()

  if (requestOptions.signal?.aborted) {
    stopped = true
  } else {
    requestOptions.signal?.addEventListener('abort', abort, { once: true })
    void connect()
  }

  return {
    send: (data) => {
      if (stopped) return
      const frame = isRawFrame(data) ? data : JSON.stringify(data)
      if (socket?.readyState === 1) transmit(socket, frame)
      else queue.push(frame)
    },
    close,
    getSocket: () => socket,
  }
}

export { openWs }
