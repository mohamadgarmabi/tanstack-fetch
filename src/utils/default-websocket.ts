import type { CreateWebSocket } from '../types'

const defaultCreateWebSocket: CreateWebSocket = (url, { protocols, headers }) =>
  Object.keys(headers).length > 0
    ? // Non-standard init accepted by Node 22+ (undici), Bun and Deno.
      new WebSocket(url, { protocols, headers } as never)
    : new WebSocket(url, protocols)

export { defaultCreateWebSocket }
