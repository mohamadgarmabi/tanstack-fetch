---
title: Configuration
description: Configure createFetch — baseUrl, auth, status handlers for 401–429, plugins, and interceptors for tanstack-fetch.
---

# Configuration

![Auth, token, and status handlers](/images/docs-auth-status.png)

Two paths: **simple** (most apps) and **advanced** (plugins + interceptors).

<StatusPlayground />

## Simple path

Set API URL, attach a token, decide what happens on **4xx / 5xx** — including **429**.

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'
import { createAuthInterceptor, createStatusInterceptor } from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({
      401: () => {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      },
      403: () => {
        console.warn('No permission')
      },
      404: ({ error }) => {
        console.warn('Missing resource', error.message)
      },
      429: ({ context }) => {
        const waitMs = parseRetryAfter(context.response?.headers, 1000)
        console.warn('Rate limited — retry in', waitMs, 'ms')
      },
      '4xx': ({ status }) => {
        console.warn('Other 4xx', status) // any 4xx without its own handler
      },
      '5xx': ({ status }) => {
        console.error('Server error', status) // 500–599
      },
    }),
  ],
})
```

### Status shortcuts

::: info Full entries only
These options are accepted by `createFetch` from `tanstack-fetch/sse` / `/live`, by `createTRPCFetch` (`/trpc`) and by the framework providers (`FetchProvider`, `createFetchPlugin`, …). The slim core `tanstack-fetch` takes the interceptors above instead: `getToken` / `auth` → `createAuthInterceptor`, `onX` / `onStatus` → `createStatusInterceptor({ 401, 403, …, '4xx', '5xx' })`.
:::

```ts
import { createFetch } from 'tanstack-fetch/sse'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    window.location.href = '/login'
  },
  onServerError: ({ status }) => console.error('Server error', status),
})
```

| Option                         | When                                       |
| ------------------------------ | ------------------------------------------ |
| `getToken` / `auth`            | Every request — Bearer token               |
| `onBadRequest`                 | HTTP **400**                               |
| `onUnauthorized`               | HTTP **401**                               |
| `onForbidden`                  | HTTP **403**                               |
| `onNotFound`                   | HTTP **404**                               |
| `onMethodNotAllowed`           | HTTP **405**                               |
| `onRequestTimeout`             | HTTP **408**                               |
| `onConflict`                   | HTTP **409**                               |
| `onGone`                       | HTTP **410**                               |
| `onPayloadTooLarge`            | HTTP **413**                               |
| `onUnsupportedMediaType`       | HTTP **415**                               |
| `onUnprocessableEntity`        | HTTP **422**                               |
| `onTooManyRequests`            | HTTP **429**                               |
| `onUnavailableForLegalReasons` | HTTP **451**                               |
| `onClientError`                | Any other **4xx** (`4xx`)                  |
| `onServerError`                | HTTP **5xx**                               |
| `onStatus`                     | Advanced map (exact / buckets / `default`) |

Resolution order: **exact status** → **`5xx` / `4xx` buckets** → **`default`**.

### Advanced auth + status map

```ts
createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({
      getToken: async () => (await cookies()).get('token')?.value,
      header: 'authorization',
      scheme: 'Bearer', // use '' for a raw token / API key
    }),
    createStatusInterceptor({
      401: () => redirect('/login'),
      403: () => toast.error('Forbidden'),
      404: () => toast.error('Not found'),
      429: ({ context }) => {
        const delayMs = parseRetryAfter(context.response?.headers, 1000)
        return { action: 'retry', delayMs }
      },
      500: () => toast.error('Server error'),
      '4xx': ({ status }) => console.warn('client', status),
      '5xx': ({ status }) => console.error('upstream', status),
      default: ({ status }) => console.warn('unhandled', status),
    }),
  ],
})
```

On the full entries / providers the same objects go in `auth: { … }` and `onStatus: { … }`.

## Advanced path — plugins + interceptors

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => getAccessToken() }),
    createStatusInterceptor({
      401: () => logout(),
      429: ({ context }) => ({
        action: 'retry',
        delayMs: parseRetryAfter(context.response?.headers, 2000),
      }),
    }),
    createTraceInterceptor(),
    createSsrForwardInterceptor(),
    createRetryIdempotentInterceptor(),
    createSseResumeInterceptor(),
    {
      name: 'locale',
      order: 25,
      onRequest: (context) => {
        context.request.headers.set('accept-language', 'fa')
        return { action: 'continue', context }
      },
    },
  ],
})

api.use('audit', {
  onResponse: (context) => {
    console.log(context.response?.status, context.request.url.pathname)
    return { action: 'continue', context }
  },
})
```

See [Plugins & interceptors](./plugins) · [Rate limit (429)](/recipes/rate-limit).

## Live connections (`tanstack-fetch/live`)

The same options (`baseUrl`, `headers`, `getToken` / `auth`, `plugins`, `interceptors`, status handlers) apply to `api.sse`, `api.ws`, `api.transport` and `api.stream`. Two extra client options plug in the socket implementation:

| Option               | For                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------ |
| `createWebSocket`    | `api.ws` on runtimes without a global `WebSocket` (Node < 22), e.g. the `ws` package |
| `createWebTransport` | `api.transport` with a WebTransport polyfill outside browsers                        |

```ts
import WS from 'ws'
import { createFetch } from 'tanstack-fetch/live'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => getAccessToken(),
  createWebSocket: (url, { protocols, headers }) => new WS(url, protocols, { headers }) as never,
})
```

Per-connection options (`authIn`, `reconnect`, `protocols`, `transport`, `webTransport`) are in [WebSocket, WebTransport & streams](./websocket#options).
