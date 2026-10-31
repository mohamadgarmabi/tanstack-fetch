---
title: WebSocket, WebTransport & NDJSON streams
description: Authenticated WebSocket (api.ws + useWs) with reconnect and send queue, WebTransport over HTTP/3 (api.transport), and NDJSON streaming over fetch (api.stream).
---

# WebSocket, WebTransport & NDJSON streams

`tanstack-fetch/live` is the client with every live transport: `api.sse()`, `api.ws()`, `api.transport()` and `api.stream()`. They all share the client's `baseUrl`, `headers`, `getToken` / `auth`, `plugins` and interceptors. This is a separate entry, so apps that only need SSE keep importing the smaller `tanstack-fetch/sse`.

```ts
import { createFetch } from 'tanstack-fetch/live'

const api = createFetch({
  baseUrl: 'https://api.example.com', // https → wss for api.ws()
  getToken: () => localStorage.getItem('access_token'),
})
```

|                         | Direction       | Delivery                       | Header auth in browser | Use for                   |
| ----------------------- | --------------- | ------------------------------ | ---------------------- | ------------------------- |
| [`api.sse`](/guide/sse) | server → client | reliable                       | ✅                     | feeds, notifications      |
| `api.ws`                | both            | reliable, ordered              | ❌ (`authIn`)          | chat, collaboration       |
| `api.transport`         | both            | datagrams (may drop / reorder) | ❌ (`authIn`)          | games, cursors, telemetry |
| `api.stream`            | server → client | reliable                       | ✅                     | LLM tokens, exports, logs |

## WebSocket: `api.ws`

```ts
const chat = api.ws<ChatMessage, { id: number }, OutgoingMessage>('/rooms/:id', {
  params: { id: 7 },
  onOpen: () => console.log('open'),
  onMessage: (data) => console.log(data), // JSON frames are parsed
  onReconnect: (attempt) => console.log('reconnecting', attempt),
  onClose: () => console.log('closed'), // fires exactly once
})

chat.send({ text: 'hi' }) // queued until open; ignored after close
chat.close()
```

### Typed path params

Every live call (`sse`, `ws`, `transport`, `stream`) and every `useSse` / `useWs` hook types `params` exactly like `api.get`:

```ts
api.ws('/rooms/:id', { params: { id: 7 } }) // inferred from the URL — `id` required
api.ws<ChatMessage, { id: number }>('/rooms/:id', { params: { id: 7 } }) // your type; path must contain :id
api.ws<ChatMessage, NoParams, OutgoingMessage>('/feed') // skip params, type outgoing frames
```

Generics follow HTTP: `<Message, Params, Send>` for `ws` / `transport` / `useWs`, `<Message, Params>` for `sse` / `stream` / `useSse`. Passing only `<Message>` loses the path literal (a TypeScript limit), so add the params type to keep `params` checked.

Absolute URLs work too: `api.ws('wss://realtime.example.com/socket')`.

### Live demo

<RealtimeDemo kind="ws" />

### Auth

The token comes from `getToken` / `auth` / interceptors (including `refresh-token`), and it is fetched again on every reconnect. Where it goes is set by `authIn`:

| `authIn`   | Where the token goes                                | Default             |
| ---------- | --------------------------------------------------- | ------------------- |
| `header`   | `Authorization: Bearer …` (plus all client headers) | Node 22+, Bun, Deno |
| `query`    | `?token=…` (rename with `authQueryKey`)             | —                   |
| `protocol` | appended to `Sec-WebSocket-Protocol`                | —                   |

Browsers and Web Workers **can't send WebSocket headers**. There, if a token exists and `authIn` isn't set, `onError` fires and nothing is sent, so your token never lands in a URL unless you choose that:

```ts
api.ws('/live', { authIn: 'query' })
```

::: warning Query tokens
URLs can end up in server and proxy logs. Prefer short-lived tokens with `authIn: 'query'`. With `authIn: 'protocol'`, the server has to echo one of the offered subprotocols, or the browser drops the connection.
:::

On Node < 22 (no global `WebSocket`), plug in the `ws` package:

```ts
import WS from 'ws'

createFetch({
  baseUrl: 'https://api.example.com',
  createWebSocket: (url, { protocols, headers }) => new WS(url, protocols, { headers }) as never,
})
```

### Options

| Option      | Default                         |                                                                                              |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| `reconnect` | `{ retries: 5, delayMs: 1000 }` | Exponential backoff (max 30s). `false` disables it. Failed token refreshes count as attempts |
| `protocols` | —                               | Subprotocols                                                                                 |
| `parseAs`   | JSON when possible              | `'text'` keeps raw strings. Binary frames are passed as-is                                   |
| `signal`    | —                               | Aborting closes the socket                                                                   |
| `transport` | `'websocket'`                   | `'webtransport'`, see below                                                                  |

## WebTransport: `api.transport`

The same API over an HTTP/3 [WebTransport](https://developer.mozilla.org/docs/Web/API/WebTransport_API) session. Each message is a **datagram**: low latency and never blocked by a lost packet, but it can be dropped or arrive out of order. Use it when the newest value matters more than every value.

```ts
const game = api.transport<GameState, { id: string }, PlayerInput>('/game/:id', {
  params: { id },
  authIn: 'query', // WebTransport can't send headers. Set this whenever there's a token
  onMessage: (state) => draw(state),
})

game.send({ dx: 1, dy: 0 })
```

<RealtimeDemo kind="transport" />

- It's the same as `api.ws(path, { transport: 'webtransport' })`, so auth, reconnect, the send queue and hooks all behave identically.
- The URL stays `https://`.
- For local dev with a self-signed certificate, pass `webTransport: { serverCertificateHashes: [...] }`.
- For reliable streams on the same session, use `getSocket()`. Its `transport` property is the raw `WebTransport`.
- Outside browsers, pass a polyfill through `createWebTransport`.

::: tip Browser support
WebTransport ships in Chromium and Firefox. See [caniuse](https://caniuse.com/webtransport) for Safari, and fall back to `api.ws()`, which returns the same `{ send, close }` object.
:::

## Framework hooks: `useWs`

`useWs` is exported from `tanstack-fetch/react`, `/vue`, `/solid`, `/svelte` and `/angular`, and works like `useSse`:

```tsx
const { data, status, error, send, close } = useWs<ChatMessage, { id: string }>('/rooms/:id', {
  client: api,
  params: { id },
  authIn: 'query',
  // transport: 'webtransport',
})
```

`status`: `connecting` → `connected` → `disconnected` | `error`, and back to `connecting` while reconnecting.

## NDJSON streams: `api.stream`

For streaming HTTP responses that send one JSON object per line (LLM / AI APIs, exports, logs). Unlike `EventSource` and WebSocket, it supports any method, a request body, and headers everywhere.

```ts
for await (const chunk of api.stream<Token>('/chat', { body: { prompt } })) {
  output += chunk.text
}
```

<RealtimeDemo kind="stream" />

- The method defaults to `POST` when `body` is set, otherwise `GET`.
- Interceptors run the same way as for `api.get`: auth, status handlers (`onUnauthorized` …), `refresh-token` retry on 401, and `retry` decisions.
- `timeoutMs` only covers the wait for response headers, never the open-ended stream.
- Lines that aren't JSON are yielded as strings. Non-2xx responses throw a `FetchError`. `break` or `signal` cancels the request.

With TanStack Query v5, pass it straight to `streamedQuery`:

```ts
import { experimental_streamedQuery as streamedQuery } from '@tanstack/react-query'

queryOptions({
  queryKey: ['chat', prompt],
  queryFn: streamedQuery({
    streamFn: ({ signal }) => api.stream<Token>('/chat', { body: { prompt }, signal }),
  }),
})
```
