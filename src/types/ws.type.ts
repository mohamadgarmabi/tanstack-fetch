import type { SseStatus } from './sse.type'

type WsStatus = SseStatus

/**
 * Builds the socket. Default: global `WebSocket`, passing `{ protocols, headers }` when there are
 * headers (Node 22+/undici, Bun, Deno). For the `ws` package:
 * `(url, { protocols, headers }) => new WS(url, protocols, { headers })`.
 */
type CreateWebSocket = (
  url: string,
  init: { protocols?: string[]; headers: Record<string, string> },
) => WebSocket

/**
 * Builds a WebTransport session for `transport: 'webtransport'`. Default: global `WebTransport`.
 * `headers` is only honoured by implementations that support it (not browsers).
 */
type CreateWebTransport = (
  url: string,
  init: { protocols?: string[]; headers: Record<string, string>; options?: WebTransportOptions },
) => WebTransport

type WsHandlers<T = unknown> = {
  onOpen?: (event: Event) => void
  /** Text frames are JSON-parsed when possible (unless `parseAs: 'text'`); binary is passed as-is. */
  onMessage?: (data: T, event: MessageEvent) => void
  onError?: (error: unknown) => void
  /** Fires exactly once: client `close()` (no event), normal server close, or reconnects exhausted. */
  onClose?: (event?: CloseEvent) => void
  /** Called before each reconnect attempt (1-based). */
  onReconnect?: (attempt: number) => void
}

type WsOptions = {
  protocols?: string | string[]
  /**
   * `webtransport`: HTTP/3 session; messages are unreliable, unordered datagrams (low latency,
   * may drop). Same API, auth, reconnect and hooks. Default: `websocket`.
   */
  transport?: 'websocket' | 'webtransport'
  /** Passed to `new WebTransport()` — e.g. `serverCertificateHashes` for local dev. */
  webTransport?: WebTransportOptions
  /**
   * Where the auth token (`getToken` / `auth` / interceptors) goes. Default: `header` for WebSocket
   * outside the browser. Browsers / workers (and WebTransport everywhere) cannot set headers, so
   * there it must be set explicitly when a token exists — otherwise `onError` fires and nothing is sent.
   */
  authIn?: 'header' | 'query' | 'protocol'
  /** Query key for `authIn: 'query'`. Default: `token`. */
  authQueryKey?: string
  /** Reconnect after an abnormal close. Default `{ retries: 5, delayMs: 1000 }` (exponential, max 30s). */
  reconnect?: boolean | { retries?: number; delayMs?: number }
}

type WsSocket<TSend = unknown> = {
  /** Objects are JSON-stringified. Queued until open; ignored once closed. */
  send: (data: TSend) => void
  /** Close and stop reconnecting. */
  close: (code?: number, reason?: string) => void
  /** Underlying socket (undefined while connecting / reconnecting). */
  getSocket: () => WebSocket | undefined
}

export type { WsStatus, CreateWebSocket, CreateWebTransport, WsHandlers, WsOptions, WsSocket }
