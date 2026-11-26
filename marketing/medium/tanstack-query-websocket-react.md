# Your WebSocket Is Not Your Cache: Real-Time React with TanStack Query

A WebSocket can tell a React application that something changed. It cannot, by itself, tell the application what its current server state should be.

That distinction matters when you already use TanStack Query.

Imagine a support dashboard. An agent opens a ticket and sees its current messages. A second agent replies. The server pushes a WebSocket event to the first browser. The UI should update immediately, but it should also remain correct after a refresh, a reconnect, or a missed event.

I like to separate the problem into three jobs:

1. HTTP loads the authoritative snapshot.
2. WebSocket delivers live events and outgoing commands.
3. TanStack Query owns the cached server state.

This keeps the transport from becoming a second, competing state store.

The examples use tanstack-fetch, an independent TypeScript project designed to work with TanStack Query. It is not an official TanStack package.

## Start with an HTTP snapshot

Install the client and Query:

```bash
npm install tanstack-fetch @tanstack/react-query
```

Create a live client:

```ts
import { createFetch } from 'tanstack-fetch/live'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})
```

For a browser-only app, this gives HTTP and live transports the same base URL and token provider. Keep browser-only APIs such as `localStorage` out of server execution.

Now load the messages through Query:

```tsx
import { useQuery } from '@tanstack/react-query'

type Message = {
  id: string
  text: string
  author: string
}

function useMessages(roomId: string) {
  return useQuery({
    queryKey: ['rooms', roomId, 'messages'],
    queryFn: ({ signal }) =>
      api.get<Message[]>('/rooms/' + roomId + '/messages', { signal }),
  })
}
```

The query key identifies the room. The `signal` lets Query cancel a request that is no longer needed.

## Let WebSocket deliver events, not own the list

The React adapter exposes `useWs`. Its generic order is `<Message, Params, Send>`:

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { useWs } from 'tanstack-fetch/react'

type RoomEvent =
  | { type: 'message'; message: Message }
  | { type: 'typing'; userId: string; isTyping: boolean }

type SendMessage = { text: string }

function useRoomEvents(roomId: string) {
  const queryClient = useQueryClient()

  return useWs<RoomEvent, { roomId: string }, SendMessage>(
    '/rooms/:roomId',
    {
      client: api,
      params: { roomId },
      authIn: 'query',
      onMessage: (event) => {
        if (event.type !== 'message') return

        queryClient.setQueryData<Message[]>(
          ['rooms', roomId, 'messages'],
          (current = []) => {
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

The important detail is the cache update. The event contains a complete message and a stable ID, so the application can append it without creating a duplicate if the server replays an event.

If an event only says "message 123 changed", the client does not have enough information to construct the new row. In that case, invalidate the relevant query:

```ts
queryClient.invalidateQueries({
  queryKey: ['rooms', roomId, 'messages'],
})
```

Use direct cache updates when the event contains the data you need. Use invalidation when the server must calculate the new state.

## Reconnects need a consistency strategy

Automatic reconnect is useful, but reconnect is not replay.

A client can be disconnected for ten seconds while the room receives several messages. When the socket opens again, the connection is healthy, but the local cache may still be incomplete.

There are two common approaches:

- Give events stable, increasing IDs and let the server replay everything after the last acknowledged ID.
- Fetch a fresh HTTP snapshot after reconnect and let the server reconcile the state.

The second approach is often simpler for dashboards and room histories. With the `useWs` status, you can detect a later successful connection and invalidate the query. Do not do this on the first connection, because the initial HTTP query already loaded the snapshot.

Also bound long-running lists. A socket that appends every event forever will eventually create a memory problem.

## Browser authentication needs deliberate handling

Browsers cannot attach arbitrary HTTP headers to the WebSocket handshake.

The live client makes the choice explicit:

- `authIn: 'query'` sends the token in the URL.
- `authIn: 'protocol'` sends it as a WebSocket subprotocol.

Both require a server-side agreement. Query tokens can leak into proxy or server logs, so use short-lived, narrowly scoped credentials. With subprotocol authentication, the server must echo one of the offered protocols or the browser rejects the handshake.

Do not treat a successful call to `send` as proof that the server processed a command. Important actions still need application-level acknowledgements, validation, and retry rules.

## WebSocket is not always the right transport

| Requirement | Good starting point |
| --- | --- |
| Load a snapshot or submit a form | HTTP + TanStack Query |
| Server-to-client events only | SSE |
| Bidirectional messages | WebSocket |
| Low-latency datagrams where some loss is acceptable | WebTransport |

For notifications or a live feed where the browser never sends messages, SSE is usually simpler. For chat, collaboration, presence, and interactive dashboards, WebSocket is a natural fit.

## Keep the boundary boring

The best real-time architecture is not the one with the most callbacks. It is the one where every piece has one job:

- The server remains the source of truth.
- HTTP provides snapshots and reconciliation.
- WebSocket carries live events.
- TanStack Query owns the client cache.

If you want to try this pattern, start with `tanstack-fetch/live` and the [WebSocket guide](https://mohamadgarmabi.github.io/tanstack-fetch/guide/websocket). The complete [React tutorial](https://mohamadgarmabi.github.io/tanstack-fetch/blog/websocket-tanstack-query-react-live-updates) includes the initial query, typed hook, cache update, reconnect recovery, and browser authentication.

- [Install tanstack-fetch on npm](https://www.npmjs.com/package/tanstack-fetch)
- [Read the source on GitHub](https://github.com/mohamadgarmabi/tanstack-fetch)

tanstack-fetch is an independent community project, not an official TanStack package.
