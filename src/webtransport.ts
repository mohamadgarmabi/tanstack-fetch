import type { CreateWebSocket, CreateWebTransport } from './types'

const defaultCreateWebTransport: CreateWebTransport = (url, { protocols, headers, options }) => {
  if (typeof WebTransport === 'undefined') {
    throw new Error(
      'tanstack-fetch: WebTransport is not available here — pass createWebTransport (e.g. a polyfill)',
    )
  }
  return new WebTransport(url, {
    ...options,
    // `protocols` / `headers` are newer or non-standard; runtimes that don't know them ignore them.
    ...(protocols ? { protocols } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  } as WebTransportOptions)
}

const toFrame = (bytes: Uint8Array) => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return bytes
  }
}

/**
 * Presents a WebTransport session as a WebSocket-shaped object (datagrams ⇄ messages),
 * so `api.ws` lifecycle — auth, reconnect, send queue, close handling — is reused as-is.
 */
const webTransportAsSocket =
  (create: CreateWebTransport, options?: WebTransportOptions): CreateWebSocket =>
  (url, init) => {
    const transport = create(url, { ...init, options })
    const encoder = new TextEncoder()
    let writer: WritableStreamDefaultWriter<Uint8Array> | undefined
    const socket = {
      readyState: 0,
      transport,
      onopen: null as ((event: Event) => void) | null,
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null as ((event: unknown) => void) | null,
      onclose: null as ((event: CloseEvent) => void) | null,
      send: (data: unknown) => {
        const bytes =
          typeof data === 'string'
            ? encoder.encode(data)
            : ArrayBuffer.isView(data)
              ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
              : new Uint8Array(data as ArrayBuffer)
        void writer?.write(bytes).catch((error) => socket.onerror?.(error))
      },
      close: (code = 1000, reason = '') => {
        socket.readyState = 2
        transport.close({ closeCode: code, reason })
      },
    }

    const read = async () => {
      const reader = transport.datagrams.readable.getReader()
      for (;;) {
        const chunk = await reader.read()
        if (chunk.done) return
        socket.onmessage?.({ data: toFrame(chunk.value as Uint8Array) } as MessageEvent)
      }
    }

    transport.ready.then(
      () => {
        socket.readyState = 1
        writer = transport.datagrams.writable.getWriter()
        socket.onopen?.(new Event('open'))
        read().catch(() => undefined) // ends with the session; `closed` reports why
      },
      () => undefined, // `closed` rejects too and reports it below
    )
    transport.closed.then(
      (info) => {
        socket.readyState = 3
        // A graceful session close maps to a normal close (no reconnect).
        socket.onclose?.({ code: 1000, reason: info.reason ?? '' } as CloseEvent)
      },
      (error) => {
        socket.readyState = 3
        socket.onerror?.(error)
        socket.onclose?.({ code: 1006, reason: String(error) } as CloseEvent)
      },
    )
    return socket as unknown as WebSocket
  }

export { webTransportAsSocket, defaultCreateWebTransport }
