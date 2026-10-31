# Example: WebSocket chat + NDJSON answer

Uses `tanstack-fetch/live`: `useWs({ client })` for the chat room, and `api.stream` + TanStack Query `streamedQuery` for an AI answer streamed line by line. **No FetchProvider required.**

## Install

```bash
npm install tanstack-fetch react @tanstack/react-query
```

## Files

- [`src/lib/api.ts`](./src/lib/api.ts): client from `tanstack-fetch/live` (same token for HTTP, WebSocket and streams)
- [`src/ws-chat.hook.ts`](./src/ws-chat.hook.ts): `useWs` chat with message history, plus a `streamedQuery` answer
- [`src/App.tsx`](./src/App.tsx): UI only

## Notes

- Browsers can't send WebSocket headers, so the token goes in `?token=` (`authIn: 'query'`). Use short-lived tokens, or `authIn: 'protocol'` if your server echoes the subprotocol.
- After a dropped connection it reconnects with a fresh `getToken()` result.
- Swap in `transport: 'webtransport'` for HTTP/3 datagrams with the same hook.
