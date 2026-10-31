---
title: 'tanstack-fetch 2.0.0: a 3.57KB core and typed params on every live call'
titleTemplate: false
description: The tanstack-fetch core drops from 5.14KB to 3.57KB gzip — auth, status handlers and plugins become interceptors. sse, ws, transport, stream and the useSse / useWs hooks now type path params exactly like api.get.
date: 2026-10-31
category: Releases
tags: ['Core', 'Realtime']
cover: /images/blog-2-0-0-cover.jpg
---

# tanstack-fetch 2.0.0: a 3.57KB core and typed params on every live call

<p class="blog-meta">October 31, 2026</p>

![tanstack-fetch 2.0.0: 3.57KB core · typed live params](/images/blog-2-0-0-cover.jpg)

**2.0.0** is about paying only for what you use, and about types that hold all the way to the socket:

- **Slim core**: `tanstack-fetch` goes from **5.14KB** to **3.57KB** gzip. Auth, status handlers and plugins are interceptors you add
- **Typed live params**: `api.sse`, `api.ws`, `api.transport`, `api.stream`, `useSse` and `useWs` type `params` like `api.get`
- **NDJSON fixes**: streamed request bodies on Node, `onRequestError` on network failures, abortable retry delays

## Upgrade

```bash
npm install tanstack-fetch@2.0.0
```

Two breaking changes, both caught by TypeScript. If you import `createFetch` from `tanstack-fetch/sse` or `/live`, pass options to `createTRPCFetch` (`/trpc`), or configure a framework provider, only the second one can affect you.

## At a glance

| Import                | Before |      2.0.0 |
| --------------------- | -----: | ---------: |
| `tanstack-fetch`      | 5.14KB | **3.57KB** |
| `tanstack-fetch/sse`  | 6.29KB |     6.33KB |
| `tanstack-fetch/live` | 8.60KB |     8.75KB |
| `tanstack-fetch/trpc` | 3.16KB |     3.28KB |

## 1. The core is interceptors only

Core `createFetch` keeps `baseUrl`, `headers`, `source`, `incoming`, `timeoutMs`, `interceptors`, `fetch`, `credentials` and `maxRetries`. Everything else is an interceptor from `tanstack-fetch/plugins`, which you already had:

```ts
import { createFetch } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({
      401: () => logout(),
      '5xx': ({ status }) => toast.error(`Server error ${status}`),
    }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})
```

| 1.x option on core `createFetch`  | 2.0.0                                               |
| --------------------------------- | --------------------------------------------------- |
| `getToken` / `auth`               | `createAuthInterceptor({ getToken })`               |
| `onUnauthorized`, `onForbidden`…  | `createStatusInterceptor({ 401: fn, 403: fn })`     |
| `onClientError` / `onServerError` | `createStatusInterceptor({ '4xx': fn, '5xx': fn })` |
| `onStatus: map`                   | `createStatusInterceptor(map)`                      |
| `plugins: ['trace', …]`           | `createTraceInterceptor()`, …                       |
| `api.upload()`, progress events   | `createFetch` from `tanstack-fetch/sse`             |

The shortcuts did not go away: **`tanstack-fetch/sse`, `/live`, `/trpc` and every framework provider still accept them**, together with `upload()` and progress events. The fastest upgrade is one line:

```diff
- import { createFetch } from 'tanstack-fetch'
+ import { createFetch } from 'tanstack-fetch/sse'
```

`npx tanstack-fetch migrate` now scaffolds the interceptor style.

## 2. Typed params on every live call

Live calls used to lose `params` typing the moment you passed a message type, because TypeScript stops inferring the path literal. They now take a params type in the same position as `api.get<Data, Params>`:

```ts
// Inferred from the URL: `id` required
api.ws('/rooms/:id', { params: { id: 7 } })

// Your types: message, params, outgoing frames
const room = api.ws<ChatMessage, { id: number }, OutgoingMessage>('/rooms/:id', {
  params: { id: 7 },
})

api.sse<OrderEvent, { id: string }>('/orders/:id/events', { params: { id }, onMessage })
for await (const chunk of api.stream<Token, { id: string }>('/chat/:id', { params: { id } })) {
  render(chunk)
}

// @ts-expect-error the path has no :id
api.ws<ChatMessage, { id: number }>('/rooms/:roomId', { params: { id: 7 } })
```

The hooks follow suit in React, Vue, Solid, Svelte and Angular:

```ts
const { data, send } = useWs<ChatMessage, { id: string }, OutgoingMessage>('/rooms/:id', {
  params: { id: roomId },
  authIn: 'query',
})
```

Generic order is `<Message, Params, Send>` for `ws` / `transport` / `useWs`, and `<Message, Params>` for `sse` / `stream` / `useSse`. Use `NoParams` to skip to `Send`. `tanstack-fetch generate` now emits the params type for SSE and NDJSON operations too.

## Also fixed

- **`api.stream()` with a `ReadableStream` body** sends `duplex: 'half'`, which Node / undici require.
- **Network errors in `api.stream()`** run `onRequestError` (retry, short-circuit) like HTTP calls.
- **Aborting during a retry delay** rejects right away instead of waiting the delay out.

## Upgrade notes

1. Core `createFetch` from `tanstack-fetch` with `getToken`, `plugins`, status shortcuts or `upload()`: move them to `interceptors`, or switch the import to `tanstack-fetch/sse`.
2. `ws` / `transport` / `useWs` with two generics: `ws<Message, Send>` is now `ws<Message, Params, Send>` — insert your params type or `NoParams`.

See also: [Plugins](/guide/plugins) · [WebSocket, WebTransport & streams](/guide/websocket) · [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)
