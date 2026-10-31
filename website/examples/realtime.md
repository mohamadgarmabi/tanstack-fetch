---
title: WebSocket, WebTransport & NDJSON live demos
description: Live demos of api.ws (auth, send queue, reconnect with a fresh token), api.transport (WebTransport datagrams) and api.stream (NDJSON / LLM tokens) — real tanstack-fetch/live code against mock servers.
---

# WebSocket, WebTransport & NDJSON

Each demo runs the real **`tanstack-fetch/live`** client in your browser against a mock server. No backend is needed. Guide: [WebSocket, WebTransport & streams](/guide/websocket).

## WebSocket: `api.ws`

1. Click **Connect**, and send a message right away. It's queued until the socket opens.
2. Click **Drop connection** to simulate a network drop (close code 1006).
3. Watch it reconnect: `getToken()` runs again, so the URL gets a fresh token (`demo-token-v2`, …).

<RealtimeDemo kind="ws" />

## WebTransport: `api.transport`

Game state arrives as HTTP/3 datagrams, about 16 per second. `send()` pushes input back on the same session.

<RealtimeDemo kind="transport" />

## NDJSON stream: `api.stream`

An LLM-style answer streamed one JSON line at a time, from a `POST` with a body and an `Authorization` header. `Stop` aborts the request through `signal`.

<RealtimeDemo kind="stream" />

## Framework hooks

`useWs` gives you the same socket as reactive state in React, Vue, Solid, Svelte and Angular:

```tsx
import { useWs } from 'tanstack-fetch/react'

const { data, status, send } = useWs<ChatMessage, { id: string }>('/rooms/:id', {
  client: api,
  params: { id },
  authIn: 'query',
  // transport: 'webtransport',
})
```

See the `useWs` section in each guide: [React](/guide/react#usews) · [Vue](/guide/vue#usews) · [Solid](/guide/solid#usews) · [Svelte](/guide/svelte#usews) · [Angular](/guide/angular#usews).
