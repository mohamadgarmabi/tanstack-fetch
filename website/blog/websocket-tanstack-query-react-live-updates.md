---
title: 'TanStack Query WebSocket in React: typed live updates'
titleTemplate: false
description: 'Build typed React WebSocket updates with TanStack Query: load HTTP snapshots, sync events into the Query cache, reconnect safely, and authenticate browser sockets.'
date: 2026-11-26
category: Tutorials
tags: ['WebSocket', 'TanStack Query', 'React', 'Real-time']
---

# TanStack Query WebSocket in React: typed live updates

<p class="blog-meta">November 26, 2026 · WebSocket · React · TanStack Query</p>

A live chat, collaborative editor, or operations dashboard needs more than a request that finishes once. It needs a connection that can carry messages in both directions while the UI stays consistent with the rest of the application's server state.

That raises a practical question: **where does WebSocket fit when an application already uses TanStack Query?**

The clean boundary is:

- **TanStack Query** owns the cached server state and the HTTP snapshot used to load it.
- **WebSocket** transports live events and client commands.
- **Your application** decides how an event changes the cache and how to recover after a disconnect.

This tutorial builds that boundary with React, TanStack Query, and [tanstack-fetch](https://mohamadgarmabi.github.io/tanstack-fetch/). tanstack-fetch is an independent community project, not an official TanStack package.

## 1. Install and create the live client

The WebSocket API is exported from the `tanstack-fetch/live` entry. The regular `tanstack-fetch` entry stays focused on HTTP; the `/live` entry adds SSE, WebSocket, WebTransport, and NDJSON streams.

```bash
npm install tanstack-fetch @tanstack/react-query
```

Create one client in a browser-only React application:

```ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch/live'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})
```

The client can be shared by regular HTTP requests and live transports. You do not need a separate WebSocket client just to reuse the same base URL and token provider.

If this application also renders on the server, do not access `localStorage` from server execution. Create or configure the client in the appropriate browser boundary, or provide a request-scoped server strategy.

## 2. Load the initial state with TanStack Query

A WebSocket connection is not a replacement for loading the current state. A user who opens a chat room needs the messages that already exist, not only the messages sent after the socket connects.

Use an HTTP endpoint for the initial snapshot:

```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '~/lib/api'

type RoomMessage = {
  id: string
  roomId: string
  author: string
  text: string
  createdAt: string
}

export function useRoomMessages(roomId: string) {
  return useQuery({
    queryKey: ['rooms', roomId, 'messages'],
    queryFn: ({ signal }) =>
      api.get<RoomMessage[]>(`/rooms/${roomId}/messages`, { signal }),
  })
}
```

Passing Query's `AbortSignal` lets an obsolete request be cancelled. The query key identifies the room's cached message list.

## 3. Open a typed WebSocket connection

The React adapter exports `useWs`. It returns the last received message, connection status, error, `send`, and `close`.

```tsx
import { useWs } from 'tanstack-fetch/react'
import { api } from '~/lib/api'

type RoomEvent =
  | { type: 'message'; message: RoomMessage }
  | { type: 'typing'; userId: string; isTyping: boolean }

type SendMessage = {
  text: string
}

function RoomSocket({ roomId }: { roomId: string }) {
  const { data, status, error, send, close } = useWs<
    RoomEvent,
    { roomId: string },
    SendMessage
  >('/rooms/:roomId', {
    client: api,
    params: { roomId },
    authIn: 'query',
  })

  return (
    <section>
      <p>Connection: {status}</p>
      {status === 'error' && <p role="alert">{String(error)}</p>}
      {data?.type === 'message' && <p>Latest: {data.message.text}</p>}
      <button onClick={() => send({ text: 'Hello!' })}>Send</button>
      <button onClick={close}>Disconnect</button>
    </section>
  )
}
```

The generic order is `<Message, Params, Send>`. The route contains `:roomId`, so TypeScript checks that the matching `params` object supplies a `roomId`. This is the same route-parameter style used by the HTTP client.

The client queues messages sent before the socket opens and flushes them after the connection is established. Once the socket is closed, later calls to `send` are ignored. For important business commands, still build an application-level acknowledgement and retry policy rather than treating a successful call to `send` as proof that the server processed the command.

## 4. Keep the Query cache in sync with incoming events

The socket hook gives you the latest event. TanStack Query should still own the message list.

Update the matching query when the server sends a new message:

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { useWs } from 'tanstack-fetch/react'
import { api } from '~/lib/api'

function useRoomSocket(roomId: string) {
  const queryClient = useQueryClient()

  return useWs<RoomEvent, { roomId: string }, SendMessage>('/rooms/:roomId', {
    client: api,
    params: { roomId },
    authIn: 'query',
    onMessage: (event) => {
      if (event.type !== 'message') return

      queryClient.setQueryData<RoomMessage[]>(
        ['rooms', roomId, 'messages'],
        (current = []) => {
          // A replayed event should not create a duplicate row.
          if (current.some((message) => message.id === event.message.id)) {
            return current
          }

          return [...current, event.message]
        },
      )
    },
  })
}
```

This example assumes the server sends a complete message object and a stable message ID. If an event only says that something changed, invalidating the query is safer than guessing how to update the cached object:

```ts
queryClient.invalidateQueries({
  queryKey: ['rooms', roomId, 'messages'],
})
```

For high-volume feeds, consider bounding the cached list or keeping a separate window of recent messages. Appending every event forever makes the cache grow without limit.

## 5. Reconnects are not the same as replay

The live client reconnects automatically by default. Its default policy allows five retries, starts with a one-second delay, and increases the delay exponentially up to 30 seconds. You can customize it:

```ts
useWs<RoomEvent, { roomId: string }, SendMessage>('/rooms/:roomId', {
  client: api,
  params: { roomId },
  reconnect: { retries: 8, delayMs: 500 },
})
```

A reconnect restores the connection. It does **not** prove that no messages were missed while the client was offline.

For a chat or dashboard, use one of these recovery strategies:

1. Include a monotonically increasing event ID and let the server replay events after the last acknowledged ID.
2. Send a fresh snapshot after the connection opens.
3. Invalidate the relevant Query key after reconnect so the HTTP endpoint reconciles the cache.

The third option is often the simplest. For example, track whether the socket has connected before, then invalidate after later successful connections:

```tsx
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

function useResyncAfterReconnect(status: string, roomId: string) {
  const queryClient = useQueryClient()
  const connectedBefore = useRef(false)

  useEffect(() => {
    if (status !== 'connected') return

    if (connectedBefore.current) {
      void queryClient.invalidateQueries({
        queryKey: ['rooms', roomId, 'messages'],
      })
    }

    connectedBefore.current = true
  }, [status, roomId, queryClient])
}
```

Use this alongside the socket hook in the same component. It intentionally refetches the HTTP snapshot after a later connection, rather than assuming the stream can recover every event.

A normal close (code `1000`) ends the connection without another retry. Other unexpected close codes use the configured reconnect policy. Calling `close()` is the explicit way to stop the connection, for example when the user leaves the room.

## 6. Browser authentication needs an explicit choice

There is an important platform limitation: browser WebSocket APIs cannot attach arbitrary HTTP headers to the opening handshake.

On supported server runtimes such as Node.js 22+, Bun, and Deno, the client can use header authentication. In browsers and Web Workers, choose where the token should go:

- `authIn: 'query'` puts it in a URL query parameter.
- `authIn: 'protocol'` offers it as a WebSocket subprotocol.

The client does not silently put a token in the URL or subprotocol. If a browser connection has a token but no supported `authIn` choice, it reports an error instead.

Treat both browser options carefully. Query strings can appear in proxy and server logs, so use short-lived, narrowly scoped tokens if you choose `authIn: 'query'`. With `authIn: 'protocol'`, the server must echo an offered subprotocol or the browser rejects the handshake. Your server and client must agree on the same authentication contract.

The token is obtained again when a reconnect is attempted, so a token provider can return a refreshed credential. Authentication, authorization, room membership, and message validation must still be enforced by the server.

## 7. When should you use WebSocket, SSE, or regular queries?

| Requirement | Better fit |
| --- | --- |
| Load a resource or fetch a snapshot | TanStack Query + HTTP |
| Server pushes events, client does not need to send messages | SSE |
| Client and server both send messages | WebSocket |
| Low-latency datagrams where occasional loss is acceptable | WebTransport |
| Stream newline-delimited JSON over HTTP | `api.stream()` |

WebSocket is a good fit for chat, collaboration, presence, multiplayer state, and interactive dashboards. It is not automatically the best choice for every live page. If the server only needs to push updates, SSE is usually simpler and has a useful HTTP-based reconnect model.

## 8. Keep the responsibilities separate

A maintainable real-time feature usually has three clear pieces:

- An HTTP query for the initial snapshot and reconciliation.
- A WebSocket connection for live events and outgoing commands.
- A small event handler that updates or invalidates the appropriate Query keys.

That separation keeps transport details out of components that only need cached data. It also gives you a clear place to test reconnects, duplicate events, stale snapshots, and authorization failures.

Explore the implementation details in the [WebSocket, WebTransport and NDJSON guide](/guide/websocket), the [React adapter guide](/guide/react#usews), and the [TanStack Query guide](/guide/tanstack-query). For a complete mocked HTTP, SSE, and WebSocket example, see [Mock your API in the client](/blog/mock-api-http-sse-websocket-tanstack-fetch).

---

**One final rule:** treat the socket as a delivery channel, not as your database. Let the server own the truth, let Query own the client cache, and make reconnect recovery an explicit part of the protocol.

**Try it:** [Install tanstack-fetch from npm](https://www.npmjs.com/package/tanstack-fetch), [read the live transport guide](/guide/websocket), or [explore the source on GitHub](https://github.com/mohamadgarmabi/tanstack-fetch).
