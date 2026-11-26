---
title: "TanStack Query WebSocket in React: Typed Live Updates"
published: false
description: "Build typed WebSocket updates in React with TanStack Query: load an HTTP snapshot, sync events into the cache, recover after reconnects, and authenticate browser sockets."
tags: react, typescript, webdev, tanstackquery
canonical_url: https://mohamadgarmabi.github.io/tanstack-fetch/blog/websocket-tanstack-query-react-live-updates
---

# TanStack Query WebSocket in React: typed live updates without polling

Polling is often the first solution for a live dashboard. Fetch every few seconds, update the screen, repeat.

It works, but it also creates unnecessary requests and leaves a gap between a server-side change and the next poll. When the backend already exposes a WebSocket, you can push events to the browser instead.

The important part is not opening the socket. It is keeping the socket, the HTTP snapshot, and the TanStack Query cache consistent.

I use three clear responsibilities:

- **TanStack Query** loads and caches the current server state.
- **WebSocket** delivers live events and client messages.
- **The application** decides how each event changes the cache and how to recover after a disconnect.

This walkthrough uses React, TanStack Query, and tanstack-fetch. tanstack-fetch is an independent community project, not an official TanStack package.

## Install

```bash
npm install tanstack-fetch @tanstack/react-query
```

Create a shared live client:

```ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch/live'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})
```

This example is for a browser-only client. Do not read `localStorage` during server rendering. For SSR, create a request-scoped client or configure the browser client only inside the browser boundary.

## 1. Load the first snapshot over HTTP

A socket only tells you about events sent after it connects. It does not automatically contain the messages that already exist in a room.

Use a normal query for the initial state:

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
      api.get<RoomMessage[]>('/rooms/' + roomId + '/messages', { signal }),
  })
}
```

Passing Query's `AbortSignal` allows an obsolete request to be cancelled when the query is no longer needed.

## 2. Subscribe to typed WebSocket events

The React adapter exports `useWs` from `tanstack-fetch/react`. Its generic order is `<Message, Params, Send>`.

```tsx
import { useWs } from 'tanstack-fetch/react'
import { api } from '~/lib/api'

type RoomEvent =
  | { type: 'message'; message: RoomMessage }
  | { type: 'typing'; userId: string; isTyping: boolean }

type SendMessage = { text: string }

function useRoomSocketConnection(roomId: string) {
  return useWs<RoomEvent, { roomId: string }, SendMessage>(
    '/rooms/:roomId',
    {
      client: api,
      params: { roomId },
      authIn: 'query',
    },
  )
}
```

The route contains `:roomId`, so TypeScript checks that the matching `params` object supplies the parameter. The hook returns the latest message, connection status, error, `send`, and `close`.

## 3. Update the Query cache from events

TanStack Query should continue to own the message list. When an event contains the complete message, update the matching cache entry directly:

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { useWs } from 'tanstack-fetch/react'
import { api } from '~/lib/api'

function useRoomSocket(roomId: string) {
  const queryClient = useQueryClient()

  return useWs<RoomEvent, { roomId: string }, SendMessage>(
    '/rooms/:roomId',
    {
      client: api,
      params: { roomId },
      authIn: 'query',
      onMessage: (event) => {
        if (event.type !== 'message') return

        queryClient.setQueryData<RoomMessage[]>(
          ['rooms', roomId, 'messages'],
          (current = []) => {
            // A replayed event must not create a duplicate message.
            if (current.some((item) => item.id === event.message.id)) {
              return current
            }

            return [...current, event.message]
          },
        )
      },
    },
  )
}
```

This assumes every message has a stable ID and the event contains the full message. If the server sends only an ID or a partial change notification, do not guess the new cache value. Invalidate the query and let the HTTP endpoint return the authoritative state:

```ts
queryClient.invalidateQueries({
  queryKey: ['rooms', roomId, 'messages'],
})
```

For high-volume feeds, also bound the cached list. Appending every event forever turns a real-time feature into an unbounded memory queue.

## 4. Reconnect does not mean replay

The default WebSocket policy retries up to five times, starts with a one-second delay, and uses exponential backoff up to 30 seconds. You can tune it with `reconnect`.

But reconnecting only restores the connection. It does not prove that the browser received every event while it was offline.

A practical recovery strategy is to invalidate the HTTP snapshot after every reconnect, but not after the first connection:

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

Use this alongside the socket hook. If your backend supports event IDs and replay, you can resume from the last acknowledged ID instead. Either way, make recovery an explicit part of the protocol.

## 5. Browser WebSocket authentication is different

The browser WebSocket API cannot attach arbitrary HTTP headers to the opening handshake.

With tanstack-fetch, choose an explicit browser strategy:

- `authIn: 'query'` puts the token in the URL.
- `authIn: 'protocol'` offers it as a WebSocket subprotocol.

Query-string tokens can appear in proxy and server logs. If you choose that route, use short-lived, narrowly scoped credentials. With subprotocol authentication, the server must echo an offered protocol or the browser rejects the handshake. Authentication and authorization must always be enforced by the server.

## When should you use WebSocket, SSE, or queries?

| Need | Use |
| --- | --- |
| Load the current state | TanStack Query + HTTP |
| Server pushes events, but the client does not send messages | SSE |
| Both client and server send messages | WebSocket |
| Low-latency datagrams where occasional loss is acceptable | WebTransport |

WebSocket is useful for chat, collaboration, presence, multiplayer state, and interactive dashboards. It is not automatically the best transport for every live page. If the server only needs to push updates, SSE is usually simpler.

## Try it

```bash
npm install tanstack-fetch @tanstack/react-query
```

- [Documentation: WebSocket, WebTransport and NDJSON](https://mohamadgarmabi.github.io/tanstack-fetch/guide/websocket)
- [Full React + TanStack Query walkthrough](https://mohamadgarmabi.github.io/tanstack-fetch/blog/websocket-tanstack-query-react-live-updates)
- [npm package](https://www.npmjs.com/package/tanstack-fetch)
- [GitHub repository](https://github.com/mohamadgarmabi/tanstack-fetch)

The socket is a delivery channel, not your database. Let the server own the truth, let Query own the cache, and make reconnect recovery part of the design.
