---
title: Cookbook — an example for every feature
description: Copy-paste tanstack-fetch examples for every feature — typed HTTP, errors, status handlers, refresh token, interceptors, upload / download progress, SSE, WebSocket, WebTransport, NDJSON streams, framework hooks, tRPC, DevTools, and the CLI.
---

# Cookbook

One short, copy-paste example per feature. The core snippets are typechecked against the library source in CI ([`test/cookbook.check.ts`](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/test/cookbook.check.ts)), so they stay correct. Want to click instead? See the [live playground](/examples/playground).

[[toc]]

## Typed HTTP

```ts
import { createFetch, pathParams, type NoParams } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => auth.token }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})

// Query string + cancel
const users = await api.get<User[]>('/users', { query: { page: 1, q: 'ada' }, signal })

// Path params are typed from the path: { id } is required here
const user = await api.get('/users/:id', { params: { id: 1 } })

// Response, params map and body types
const created = await api.post<User, NoParams, CreateUser>('/users', { body: { name: 'Ada' } })
await api.patch<User, { id: number }, Partial<CreateUser>>('/users/:id', {
  params: { id: 1 },
  body: { name: 'Grace' },
})

// Reusable typed params
await api.delete('/users/:id', { params: pathParams('/users/:id', { id: 1 }) })

// Non-JSON responses
const csv = await api.get<string>('/export', { parseAs: 'text' })
const avatar = await api.get<Blob>('/avatar.png', { parseAs: 'blob' })
```

## In a TanStack Query `queryFn` / `mutationFn`

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const useUser = (id: number) =>
  useQuery({
    queryKey: ['user', id],
    queryFn: ({ signal }) => api.get<User>('/users/:id', { params: { id }, signal }),
  })

const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUser) => api.post<User, NoParams, CreateUser>('/users', { body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
```

## Errors and timeouts

```ts
import { isAbortError, isFetchError } from 'tanstack-fetch'

try {
  await api.get('/report', { timeoutMs: 5_000 })
} catch (error) {
  if (isAbortError(error)) {
    if ((error as Error).name === 'TimeoutError') toast.error('Timed out')
    // plain AbortError = cancelled (unmount, refetch, signal)
  } else if (isFetchError(error)) {
    if (error.status === 404) toast.error('Not found')
    else toast.error(`${error.code}: ${error.message}`) // error.body has the raw response
  }
}
```

More: [Errors guide](/guide/errors).

## Status handlers (401 → 429 → 5xx)

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'
import { createAuthInterceptor, createStatusInterceptor } from 'tanstack-fetch/plugins'
import { createFetch as createSseFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => auth.token }),
    createStatusInterceptor({
      401: () => {
        window.location.href = '/login'
      },
      403: ({ error }) => toast.error(error.message),
      // Respect Retry-After, then retry
      429: ({ context }) => ({
        action: 'retry',
        delayMs: parseRetryAfter(context.response?.headers, 1_000),
      }),
      '5xx': ({ status }) => toast.error(`Server error ${status}`),
    }),
  ],
})

// Option shortcuts (getToken, onUnauthorized, …) stay on the full clients
const shortcutApi = createSseFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => auth.token,
  onUnauthorized: () => {
    window.location.href = '/login'
  },
})
```

Try it live: [status matrix](/examples/playground#status-matrix-incl-429).

## Refresh token (before expiry + after first 401)

```ts
import { createAuthInterceptor, createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => auth.token }),
    createRefreshTokenInterceptor({
      refresh: () => auth.refresh(), // single-flight: parallel 401s share one refresh
      before: { getExpiresAt: () => auth.expiresAt, skewMs: 30_000 },
      onRefreshFailed: () => {
        window.location.href = '/login'
      },
    }),
  ],
})
```

The same token is used by `api.ws`, `api.transport` and `api.stream`, and is fetched again on every reconnect. More: [Refresh token recipe](/recipes/refresh-token).

## Interceptors and plugins

```ts
import type { HttpInterceptor } from 'tanstack-fetch'

const timing: HttpInterceptor = {
  name: 'timing',
  onRequest: (context) => {
    context.request.headers.set('x-started-at', String(Date.now()))
    return { action: 'continue', context }
  },
  onResponseError: (context) => {
    console.warn(context.request.url.pathname, context.error?.status)
    return { action: 'continue', context }
  },
}
api.use('timing', timing)

// Turn a plugin off for one call (never retry a payment)
await api.post('/payments', { body: { amount: 10 }, interceptors: { eject: ['retry-idempotent'] } })

// Mock one call without a server
await api.get('/flags', {
  interceptors: {
    use: [
      {
        name: 'mock-flags',
        onRequest: () => ({
          action: 'short-circuit',
          result: { ok: true, status: 200, data: { beta: true }, headers: new Headers() },
        }),
      },
    ],
  },
})
```

Built-in plugins (`tanstack-fetch/plugins`): `createTraceInterceptor`, `createRetryIdempotentInterceptor`, `createSsrForwardInterceptor`, `createSseResumeInterceptor`. More: [Plugins](/guide/plugins).

## Upload and download progress

```ts
import { createFetch } from 'tanstack-fetch/sse' // upload + progress need the full client

const api = createFetch({ baseUrl: 'https://api.example.com' })

// Single file + extra fields
await api.upload<{ id: string }>('/avatars', {
  file,
  fields: { userId: 1 },
  onUploadProgress: ({ progress }) => setPercent(Math.round((progress ?? 0) * 100)),
})

// Several files, custom field name and method
await api.upload('/gallery', { files, fieldName: 'photos', method: 'PUT' })

// Download progress on any request
await api.get<Blob>('/exports/big.zip', {
  parseAs: 'blob',
  onDownloadProgress: ({ loaded, total }) => setLabel(`${loaded}/${total ?? '?'}`),
})
```

Live demo: [Upload](/examples/upload).

## SSR: forward cookies (Next.js, Nuxt)

```ts
// app/lib/server-api.ts — Next.js App Router
import { cookies, headers } from 'next/headers'
import { createFetch } from 'tanstack-fetch'
import { createSsrForwardInterceptor } from 'tanstack-fetch/plugins'

export const serverApi = createFetch({
  baseUrl: process.env.API_URL,
  source: 'ssr',
  interceptors: [createSsrForwardInterceptor()],
  incoming: async () => ({
    cookie: (await cookies()).toString(),
    authorization: (await headers()).get('authorization') ?? undefined,
  }),
})
```

More: [SSR guide](/guide/ssr) · [Next.js demo](/examples/next-ssr).

## Live: one client for every transport

```ts
import { createFetch } from 'tanstack-fetch/live'

const live = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => auth.token,
  plugins: ['sse-resume'],
})
```

### SSE: notifications

```ts
const feed = live.sse<Notification>('/notifications', { onMessage: (n) => notify(n) })
feed.close()

// or iterate, and stop on a named event
for await (const event of live.sse<Notification>('/notifications', { signal })) {
  if (event.event === 'done') break
}
```

### WebSocket: chat with typing and binary frames

```ts
type ChatMessage = { type: 'message' | 'typing'; user: string; text?: string }

const room = live.ws<ChatMessage, { id: string }, ChatMessage | ArrayBuffer>('/rooms/:id', {
  params: { id: 'general' },
  query: { since: '2026-10-01' },
  authIn: 'query', // browsers can't send WebSocket headers
  onMessage: (message) => (message.type === 'typing' ? showTyping(message.user) : add(message)),
})

room.send({ type: 'typing', user: 'ada' }) // JSON
room.send(new ArrayBuffer(8)) // binary is sent as-is
```

### WebSocket: subprotocol auth, no reconnect, cancel with a signal

```ts
const controller = new AbortController()

live.ws('/feed', {
  authIn: 'protocol', // token is appended to Sec-WebSocket-Protocol
  protocols: ['feed.v2'],
  reconnect: false,
  signal: controller.signal,
  parseAs: 'text', // keep raw strings
})

controller.abort() // closes the socket
```

### WebSocket: another host, custom token key

```ts
live.ws('wss://realtime.example.com/socket', { authIn: 'query', authQueryKey: 'access_token' })
```

### WebSocket on Node: real `Authorization` header

```ts
// Node 22+ / Bun / Deno: the header is sent by default
const api = createFetch({ baseUrl: 'https://api.example.com', getToken })
api.ws('/jobs/:id', { params: { id }, onMessage: log })

// Node < 22: plug in the `ws` package
import WS from 'ws'

createFetch({
  baseUrl: 'https://api.example.com',
  createWebSocket: (url, { protocols, headers }) => new WS(url, protocols, { headers }) as never,
})
```

### WebTransport: multiplayer state

```ts
const game = live.transport<{ x: number; y: number }, { id: number }, { dx: number }>('/game/:id', {
  params: { id: 1 },
  authIn: 'query',
  webTransport: { congestionControl: 'low-latency' },
  onMessage: (state) => draw(state), // unreliable datagrams: newest value wins
})

game.send({ dx: 1 })
```

### NDJSON: LLM tokens, export progress, log tail

```ts
// LLM answer, token by token
let answer = ''
for await (const chunk of live.stream<{ text: string }>('/chat', { body: { prompt }, signal })) {
  answer += chunk.text
}

// Long export with progress rows
for await (const row of live.stream<{ done: number; total: number }>('/exports', {
  method: 'POST',
  body: { format: 'csv' },
})) {
  setProgress(row.done / row.total)
}

// Tail logs until a line shows up (break cancels the request)
for await (const line of live.stream<string>('/logs/tail', { query: { service: 'api' } })) {
  if (line.includes('READY')) break
}
```

### Log every live connection (interceptor hooks)

```ts
live.use('live-log', {
  onLiveOpen: (context) => {
    console.log('open', context.meta.transport, context.request.url.pathname)
    return { action: 'continue', context }
  },
  onLiveMessage: (context) => {
    console.log(context.message.direction, context.message.data) // 'in' | 'out'
    return { action: 'continue', context }
  },
  onLiveClose: (context) => {
    if (context.error) console.warn('closed', context.error.message)
    return { action: 'continue', context }
  },
})
```

Live demos: [WebSocket · WebTransport · NDJSON](/examples/realtime).

## Framework hooks

::: code-group

```tsx [React]
import { useSse, useWs } from 'tanstack-fetch/react'

const Dashboard = () => {
  const orders = useSse<Order>('/orders/stream', { client: live })
  const chat = useWs<ChatMessage>('/rooms/general', { client: live, authIn: 'query' })

  return (
    <>
      <p>
        Last order: {orders.data?.id} ({orders.status})
      </p>
      <p>
        Chat: {chat.data?.text} ({chat.status})
      </p>
      <button onClick={() => chat.send({ type: 'message', user: 'me', text: 'hi' })}>Send</button>
    </>
  )
}
```

```vue [Vue]
<script setup lang="ts">
import { useSse, useWs } from 'tanstack-fetch/vue'

const orders = useSse<Order>('/orders/stream', { client: live })
const chat = useWs<ChatMessage>('/rooms/general', { client: live, authIn: 'query' })
</script>

<template>
  <p>Last order: {{ orders.data.value?.id }} ({{ orders.status.value }})</p>
  <button @click="chat.send({ type: 'message', user: 'me', text: 'hi' })">Send</button>
</template>
```

```tsx [Solid]
import { useWs } from 'tanstack-fetch/solid'

const Chat = () => {
  const { data, status, send } = useWs<ChatMessage>('/rooms/general', {
    client: live,
    authIn: 'query',
  })
  return (
    <button onClick={() => send({ type: 'message', user: 'me', text: 'hi' })}>{status()}</button>
  )
}
```

```svelte [Svelte]
<script lang="ts">
  import { useWs } from 'tanstack-fetch/svelte'

  const { data, status, send } = useWs<ChatMessage>('/rooms/general', {
    client: live,
    authIn: 'query',
  })
</script>

<p>{$status} · {$data?.text}</p>
```

```ts [Angular]
import { useWs } from 'tanstack-fetch/angular'

@Component({ template: `<p>{{ chat.status() }} · {{ chat.data()?.text }}</p>` })
export class ChatComponent {
  readonly chat = useWs<ChatMessage>('/rooms/general', { client: live, authIn: 'query' })
}
```

:::

### Streamed query (NDJSON + TanStack Query)

```tsx
import { experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query'

const Answer = ({ prompt }: { prompt: string }) => {
  const { data: tokens = [] } = useQuery({
    queryKey: ['chat', prompt],
    queryFn: streamedQuery({
      streamFn: ({ signal }) => live.stream<Token>('/chat', { body: { prompt }, signal }),
    }),
  })
  return <p>{tokens.map((t) => t.text).join('')}</p>
}
```

### Live updates into the Query cache

```tsx
const queryClient = useQueryClient()

useWs<Order>('/orders/live', {
  client: live,
  authIn: 'query',
  onMessage: (order) =>
    queryClient.setQueryData<Order[]>(['orders'], (prev = []) => [order, ...prev]),
})
```

## tRPC on the same client

```ts
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import type { AppRouter } from './server'

export const trpc = createTRPCFetchClient<AppRouter>({ url: '/api/trpc', client: api })

const posts = await trpc.post.list.query()
```

More: [tRPC guide](/guide/trpc).

## DevTools

```ts
import { setupDevtools } from 'tanstack-fetch/devtools'

setupDevtools(live) // HTTP · SSE · SSR · tRPC · WS · Stream tabs; Alt+Shift+F toggles
```

Live demo: [DevTools](/examples/devtools).

## CLI

```bash
# Typed client from an OpenAPI document
npx tanstack-fetch generate --spec ./openapi.yaml --out ./src/api

# Health check: deps, createFetch usage, missing signal
npx tanstack-fetch doctor --dir ./src

# Rewrite axios / ky / ofetch / fetch call sites and scaffold a framework
npx tanstack-fetch migrate --from axios --framework react --dir ./src --write
```

More: [OpenAPI](/guide/openapi) · [Migrate](/guide/migrate).
