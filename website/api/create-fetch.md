---
title: createFetch
description: API reference for createFetch — options, return type, and how to build a typed tanstack-fetch client.
---

# createFetch

![createFetch mental model](/images/docs-mental-model.png)

Shared HTTP API — always available with any Framework filter (tagged **core**).

:::: framework core

```ts
import { createFetch } from 'tanstack-fetch'

const api = createFetch(options?)
```

For SSE, import from `tanstack-fetch/sse` instead. For WebSocket, WebTransport and NDJSON streams (plus SSE), import from `tanstack-fetch/live` — see [WebSocket, WebTransport & streams](/guide/websocket).

The core `tanstack-fetch` entry takes `CoreFetchOptions` (`baseUrl`, `headers`, `source`, `incoming`, `timeoutMs`, `interceptors`, `fetch`, `credentials`, `maxRetries`) and returns a `CoreFetchClient` (no `upload()`, progress events ignored). Rows marked **full only** are accepted by `tanstack-fetch/sse`, `/live`, `/trpc` and framework providers; on core use the `tanstack-fetch/plugins` factories:

```ts
import { createFetch } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }), // getToken / auth
    createStatusInterceptor({ 401: () => logout(), '5xx': ({ status }) => console.error(status) }), // onX / onStatus
    createTraceInterceptor(), // plugins: ['trace']
  ],
})
```

## `CreateFetchOptions`

| Option                         | Type                             | Notes                                                           |
| ------------------------------ | -------------------------------- | --------------------------------------------------------------- |
| `baseUrl`                      | `string`                         | Absolute URL required for SSR / Edge                            |
| `headers`                      | `HeadersInit` \| getter          | Merged into every request                                       |
| `getToken`                     | `() => token`                    | Sets Bearer auth — **full only**                                |
| `auth`                         | `{ getToken, header?, scheme? }` | Advanced auth — **full only**                                   |
| `onBadRequest`                 | status handler                   | HTTP 400 — **full only**                                        |
| `onUnauthorized`               | status handler                   | HTTP 401 — **full only**                                        |
| `onForbidden`                  | status handler                   | HTTP 403 — **full only**                                        |
| `onNotFound`                   | status handler                   | HTTP 404 — **full only**                                        |
| `onMethodNotAllowed`           | status handler                   | HTTP 405 — **full only**                                        |
| `onRequestTimeout`             | status handler                   | HTTP 408 — **full only**                                        |
| `onConflict`                   | status handler                   | HTTP 409 — **full only**                                        |
| `onGone`                       | status handler                   | HTTP 410 — **full only**                                        |
| `onPayloadTooLarge`            | status handler                   | HTTP 413 — **full only**                                        |
| `onUnsupportedMediaType`       | status handler                   | HTTP 415 — **full only**                                        |
| `onUnprocessableEntity`        | status handler                   | HTTP 422 — **full only**                                        |
| `onTooManyRequests`            | status handler                   | HTTP **429** — **full only**                                    |
| `onUnavailableForLegalReasons` | status handler                   | HTTP 451 — **full only**                                        |
| `onClientError`                | status handler                   | Any other **4xx** — **full only**                               |
| `onServerError`                | status handler                   | HTTP 5xx — **full only**                                        |
| `onStatus`                     | status map                       | Exact / `4xx` / `5xx` / `default` — **full only**               |
| `plugins`                      | `PluginName[]`                   | Built-in interceptors — **full only**                           |
| `interceptors`                 | `HttpInterceptor[]`              | Custom                                                          |
| `timeoutMs`                    | `number`                         | Per-client timeout (default 30 000) → `TimeoutError`            |
| `maxRetries`                   | `number`                         | Retry budget                                                    |
| `fetch`                        | `typeof fetch`                   | Custom fetch / tests                                            |
| `credentials`                  | `RequestCredentials`             | e.g. `include`                                                  |
| `createWebSocket`              | `CreateWebSocket`                | `api.ws` socket factory (e.g. `ws` on Node < 22) — `/live` only |
| `createWebTransport`           | `CreateWebTransport`             | `api.transport` factory (polyfills) — `/live` only              |
| `source`                       | `'browser' \| 'ssr' \| …`        | Runtime hint                                                    |
| `incoming`                     | headers \| getter                | SSR forward input                                               |

Also exported: `parseRetryAfter(headers)` for **429** `Retry-After` → ms.

## Path-typed `params`

Path placeholders make `params` required and typed (`:id` or `{id}`):

```ts
import { createFetch, pathParams } from 'tanstack-fetch'
import type { NoParams } from 'tanstack-fetch'

type User = { id: string; name: string }

const api = createFetch({ baseUrl: 'https://api.example.com' })

// params required — keys inferred from the path
await api.get('/users/:id', { params: { id: '1' } })

// response + params map — path must contain matching :id / {id}
await api.get<User, { id: string | number }>('/users/:id', { params: { id: '1' } })

// post / put / patch — optional body type (use `NoParams` when there are no path params)
await api.post<User, NoParams, { name: string }>('/users', { body: { name: 'Ada' } })

await api.get('/users/{id}/posts/{postId}', {
  params: pathParams('/users/{id}/posts/{postId}', { id: 1, postId: 2 }),
})

// no placeholders → params not accepted
await api.get('/users')
```

Only the **pathname** is scanned for placeholders, so absolute URLs with a port and colons in the query are safe:

```ts
await api.get('http://localhost:8080/users/:id?at=10:30', { params: { id: '1' } })
// → http://localhost:8080/users/1?at=10:30
```

Helpers / types: `pathParams()`, `PathParamsOf`, `ExtractPathParamKeys`, `NoParams`.

Deprecated alias: `createClient` → `createFetch`.

::::

:::: framework react

## With React

Inject the client via [`tanstack-fetch/react`](/guide/react) (`FetchProvider` / `useFetch`). API reference: [React](/api/react).

::::

:::: framework vue

## With Vue / Nuxt

Inject via [`tanstack-fetch/vue`](/guide/vue) (`createFetchPlugin` / `useFetch`). API: [Vue](/api/vue).

::::

:::: framework solid

## With Solid

Inject via [`tanstack-fetch/solid`](/guide/solid).

::::

:::: framework angular

## With Angular

Inject via [`tanstack-fetch/angular`](/guide/angular) (`provideFetchClient` / `injectFetch`).

::::

:::: framework svelte

## With Svelte

Inject via [`tanstack-fetch/svelte`](/guide/svelte) (`setFetchClient` / `useFetch`).

::::
