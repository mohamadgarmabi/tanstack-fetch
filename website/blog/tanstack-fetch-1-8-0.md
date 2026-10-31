---
title: 'tanstack-fetch 1.8.0: WebSocket, WebTransport, and NDJSON streams'
titleTemplate: false
description: New tanstack-fetch/live entry — authenticated WebSocket with reconnect and a send queue, WebTransport over HTTP/3 with the same API, NDJSON streaming over fetch, and useWs for React, Vue, Solid, Svelte and Angular.
date: 2026-10-30
category: Releases
tags: ['Core', 'Realtime']
cover: /images/blog-1-8-0-cover.jpg
---

# tanstack-fetch 1.8.0: WebSocket, WebTransport, and NDJSON streams

<p class="blog-meta">October 30, 2026</p>

![tanstack-fetch 1.8.0: WebSocket · WebTransport · NDJSON](/images/blog-1-8-0-cover.jpg)

Until now the only live transport was SSE (`api.sse()`). **1.8.0** adds the other three you usually reach for, all on one client and wired into the same auth, interceptors and plugins as your HTTP calls:

- **`api.ws()`**: WebSocket with header auth, auto-reconnect and a send queue
- **`api.transport()`**: WebTransport (HTTP/3) with the same API
- **`api.stream()`**: NDJSON / JSON-lines streaming over `fetch`
- **`useWs`**: hooks for React, Vue, Solid, Svelte and Angular

## Upgrade

```bash
npm install tanstack-fetch@1.8.0
```

They live in a new entry, **`tanstack-fetch/live`**, so apps that only use `tanstack-fetch/sse` don't ship the extra code. No changes for existing code.

```ts
import { createFetch } from 'tanstack-fetch/live'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => auth.accessToken,
  plugins: ['refresh-token'],
})
// api.get / post / sse  +  api.ws / transport / stream
```

## At a glance

|                        | `api.sse()`          | `api.ws()`            | `api.transport()`              | `api.stream()`            |
| ---------------------- | -------------------- | --------------------- | ------------------------------ | ------------------------- |
| Direction              | server → client      | both                  | both                           | server → client           |
| Protocol               | HTTP                 | WebSocket             | HTTP/3 (QUIC)                  | HTTP                      |
| Delivery               | ordered, reliable    | ordered, reliable     | datagrams: may drop or reorder | ordered, reliable         |
| Header auth in browser | ✅                   | ❌ (query / protocol) | ❌ (query / protocol)          | ✅                        |
| Request body           | ❌                   | —                     | —                              | ✅ (any method)           |
| Reconnect              | ✅ `sse-resume`      | ✅ built-in           | ✅ built-in                    | — (use Query `retry`)     |
| Good for               | feeds, notifications | chat, collaboration   | games, live cursors, telemetry | LLM tokens, exports, logs |

## 1. WebSocket: `api.ws()`

```ts
const room = api.ws<ChatMessage, OutgoingMessage>('/rooms/:id', {
  params: { id: 7 },
  onOpen: () => console.log('connected'),
  onMessage: (message) => render(message), // JSON frames are parsed
  onReconnect: (attempt) => console.log('reconnecting', attempt),
  onClose: () => console.log('closed'),
})

room.send({ text: 'hi' }) // queued until the socket opens
room.close()
```

- `https://` base URLs become `wss://`. `params`, `query`, `headers` and `signal` work like they do for `api.get`.
- **Reconnect**: after an abnormal close it retries up to 5 times with exponential backoff (max 30s). `reconnect: false` turns it off, and `{ retries, delayMs }` tunes it.
- **Send queue**: messages sent before the socket opens are flushed on open, in order. Objects are JSON-stringified, and strings or binary are sent as-is.
- **Interceptors**: `onRequest` interceptors (auth, `trace`, `ssr-forward`, your own) run before every connect and reconnect.
- **Clean lifecycle**: `onClose` fires exactly once. After `close()` the old socket can't fire `onError`, `onMessage` or `onClose`, so a React StrictMode double-mount doesn't flash an error state.

### Auth: headers where possible, explicit everywhere else

The WebSocket API in browsers **can't send headers**. Libraries usually handle this by quietly putting your token in the URL. tanstack-fetch makes it explicit instead:

| Runtime             | Default                | Options                                                     |
| ------------------- | ---------------------- | ----------------------------------------------------------- |
| Node 22+, Bun, Deno | `Authorization` header | `header` · `query` · `protocol`                             |
| Browser, Web Worker | **you choose**         | `query` (`?token=`) · `protocol` (`Sec-WebSocket-Protocol`) |

```ts
// Browser
api.ws('/live', { authIn: 'query' }) // wss://api.example.com/live?token=…
api.ws('/live', { authIn: 'protocol', protocols: 'v1' }) // Sec-WebSocket-Protocol: v1, <token>
```

If a token exists and `authIn` isn't set in a browser, `onError` explains why and **nothing is sent**. That way the token never ends up in access logs by accident.

The token comes from the same `getToken` / `auth` / `refresh-token` setup as HTTP, and it is **fetched again on every reconnect**. An expired token gets refreshed before the socket comes back. If that refresh fails, it counts as one failed attempt, not the end of the socket.

On Node < 22 (no global `WebSocket`), plug in the `ws` package:

```ts
import WS from 'ws'

createFetch({
  baseUrl: 'https://api.example.com',
  createWebSocket: (url, { protocols, headers }) => new WS(url, protocols, { headers }) as never,
})
```

## 2. WebTransport: `api.transport()`

[WebTransport](https://developer.mozilla.org/docs/Web/API/WebTransport_API) runs over HTTP/3 (QUIC). Datagrams are **unreliable and unordered**, which is exactly what you want when the newest value matters more than every value: game state, cursors, live metrics. A dropped packet never blocks the next one.

`api.transport()` is `api.ws()` over a WebTransport session. Each message is a datagram, and everything else (auth, reconnect, send queue, `onClose` rules, hooks) behaves the same:

```ts
const game = api.transport<GameState, PlayerInput>('/game/:id', {
  params: { id },
  authIn: 'query',
  onMessage: (state) => draw(state),
})

game.send({ dx: 1, dy: 0 })
```

- The URL stays `https://`, as WebTransport expects.
- For local dev with a self-signed certificate, pass `webTransport: { serverCertificateHashes: [...] }`.
- No runtime lets WebTransport send headers today, so set `authIn` whenever you have a token.
- Need reliable, ordered delivery over the same session? `getSocket()` returns the adapter, and its `transport` property is the raw `WebTransport` for `createBidirectionalStream()`.
- Outside the browser, pass a polyfill through `createWebTransport`.

::: tip Browser support
WebTransport ships in Chromium and Firefox. Check [caniuse](https://caniuse.com/webtransport) for Safari and fall back to `api.ws()` where it's missing. Both return the same `{ send, close }` object.
:::

## 3. NDJSON streams: `api.stream()`

Many AI and LLM APIs, export endpoints and log tails stream one JSON object per line. `EventSource` can't POST, and WebSocket is overkill for a single response. `api.stream()` is a plain `fetch` that yields each line as it arrives:

```ts
for await (const chunk of api.stream<Token>('/chat', { body: { prompt } })) {
  output += chunk.text
}
```

- Any method. It defaults to `POST` when there's a `body`, otherwise `GET`.
- It runs the **full interceptor pipeline**: auth, `onUnauthorized` and the other status handlers, `refresh-token` retry on 401, and `retry` decisions.
- `timeoutMs` only covers the wait for the response headers, never the stream itself.
- Lines that aren't JSON are yielded as strings. Non-2xx responses throw a `FetchError`. `break` or `signal` cancels the request.

It returns an `AsyncIterable`, so it plugs straight into TanStack Query's `streamedQuery`:

```ts
import { experimental_streamedQuery as streamedQuery, queryOptions } from '@tanstack/react-query'

const chatQuery = (prompt: string) =>
  queryOptions({
    queryKey: ['chat', prompt],
    queryFn: streamedQuery({
      streamFn: ({ signal }) => api.stream<Token>('/chat', { body: { prompt }, signal }),
    }),
  })
```

## 4. `useWs` in every framework

Same shape as `useSse`: `data` (last message), `status`, `error`, `send`, `close`. Pass `transport: 'webtransport'` to use WebTransport.

::: code-group

```tsx [React]
import { useWs } from 'tanstack-fetch/react'

const { data, status, send } = useWs<ChatMessage>('/rooms/:id', {
  client: api,
  params: { id },
  authIn: 'query',
})
```

```ts [Vue]
import { useWs } from 'tanstack-fetch/vue'

const { data, status, send } = useWs<ChatMessage>('/rooms/:id', { params: { id }, authIn: 'query' })
```

```ts [Solid / Svelte / Angular]
import { useWs } from 'tanstack-fetch/solid' // or /svelte, /angular
```

:::

`status` goes `connecting` → `connected` → `disconnected` | `error`, and returns to `connecting` during reconnects.

## 5. DevTools, interceptor hooks and the CLI

- **DevTools** has two new tabs. **WS** shows each `api.ws` / `api.transport` connection (`WS` / `WT`) with every message `↑ out` / `↓ in`; a dropped connection ends in `error` and its reconnect starts a new row. **Stream** keeps an `api.stream` request live until its last NDJSON line.
- **Interceptor hooks** for your own logging or metrics: `onLiveOpen`, `onLiveMessage` and `onLiveClose`, with `context.meta.transport` set to `'websocket' | 'webtransport' | 'ndjson'`.
- **`tanstack-fetch generate`** turns `application/x-ndjson` responses in your OpenAPI document into typed `api.stream` methods.
- **`tanstack-fetch doctor`** points out raw `new WebSocket` / `new EventSource` calls that could use the live client.

Try them: [DevTools demo](/examples/devtools) · [live demos](/examples/realtime) · [Cookbook](/examples/cookbook).

## Also fixed

- **Absolute URLs in path types**: `api.get('https://other.host/x')` no longer asks for an empty `params` key, because the `:` in the scheme was being read as a param.

## Upgrade notes

Nothing to change. `tanstack-fetch/sse` is unchanged, and the new APIs are only on `tanstack-fetch/live`. To switch an existing SSE client over, change the import:

```diff
- import { createFetch } from 'tanstack-fetch/sse'
+ import { createFetch } from 'tanstack-fetch/live'
```

See also: [WebSocket, WebTransport & streams](/guide/websocket) · [SSE](/guide/sse) · [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)
