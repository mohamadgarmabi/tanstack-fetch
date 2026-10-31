---
title: Plugins & interceptors
description: Built-in tanstack-fetch plugins — trace, ssr-forward, retry, sse-resume — plus custom interceptors and refresh-token.
---

# Plugins & interceptors

![Named plugin and interceptor pipeline](/images/docs-plugins.png)

## Built-in plugins

| Plugin             | Factory (`tanstack-fetch/plugins`)   | Role                                                 |
| ------------------ | ------------------------------------ | ---------------------------------------------------- |
| `trace`            | `createTraceInterceptor()`           | Adds `x-request-id`                                  |
| `ssr-forward`      | `createSsrForwardInterceptor()`      | Forwards cookies / auth on the server                |
| `retry-idempotent` | `createRetryIdempotentInterceptor()` | Retries safe methods on retryable statuses           |
| `sse-resume`       | `createSseResumeInterceptor()`       | Drops heartbeats; sends `Last-Event-ID` on reconnect |

```ts
import { createFetch } from 'tanstack-fetch'
import {
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

createFetch({
  interceptors: [
    createTraceInterceptor(),
    createSsrForwardInterceptor(),
    createRetryIdempotentInterceptor(),
    createSseResumeInterceptor(),
  ],
})
```

`tanstack-fetch/sse`, `/live`, `/trpc` and framework providers also accept the string shorthand `plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume']`.

## Named interceptors

```ts
api.use('locale', {
  order: 25,
  onRequest: (context) => {
    context.request.headers.set('accept-language', 'fa')
    return { action: 'continue', context }
  },
})

api.eject('locale')
```

## Interceptor hooks

| Hook                                                                        | When                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `onRequest`                                                                 | Before every request, and before every SSE / WebSocket / WebTransport / NDJSON connect (auth, headers) |
| `onResponse` / `onResponseError`                                            | HTTP response (also `api.stream` headers)                                                              |
| `onRequestError`                                                            | Network failure                                                                                        |
| `onSseOpen` / `onSseEvent` / `onSseError` / `onSseReconnect` / `onSseClose` | `api.sse` lifecycle                                                                                    |
| `onLiveOpen`                                                                | `api.ws` / `api.transport` connected, or `api.stream` response opened                                  |
| `onLiveMessage`                                                             | Every live message: `context.message.direction` is `'in'` or `'out'`                                   |
| `onLiveClose`                                                               | Once per connection; `context.error` is set when it ended abnormally                                   |

`context.meta.transport` tells live connections apart: `'websocket' | 'webtransport' | 'ndjson'`.

```ts
api.use('live-log', {
  onLiveMessage: (context) => {
    console.log(context.meta.transport, context.message.direction, context.message.data)
    return { action: 'continue', context }
  },
})
```

## Per-request control

```ts
await api.get('/admin', {
  interceptors: {
    use: [extraInterceptor],
    eject: ['retry-idempotent'],
  },
})
```

## Match filters

Interceptors can `match` on `operation`, `method`, `pathPrefix`, or `status`.

Decision actions: `continue` · `skip` · `retry` · `short-circuit` · `drop`.

See [Refresh token recipe](/recipes/refresh-token) for a real 401 → refresh → retry interceptor.
