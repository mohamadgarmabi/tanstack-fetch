---
title: 'Mock API requests: HTTP, SSE, WebSocket and tRPC'
description: Mock HTTP, SSE, NDJSON streams, WebSocket, upload and tRPC routes with createMocks from tanstack-fetch/mock. Each route can be turned on or off, and requests without a mock go to the real API.
---

# Mocking API routes

![Mocking API routes](/images/page-guide-mocking.jpg)

Build routes with `createMocks()` from `tanstack-fetch/mock` and pass them as the `mocks` option, and requests are answered by local handlers instead of the network. It works for every transport the client has:

| Transport                | Route                               | Handler returns                          |
| ------------------------ | ----------------------------------- | ---------------------------------------- |
| `api.get` / `post` / …   | `{ method, path, handler }`         | data, a `Response`, or `undefined`       |
| `api.upload`             | `{ method: 'POST', path, handler }` | same as HTTP                             |
| `api.sse`                | `{ path, sse: true, handler }`      | an (async) iterable of event `data`      |
| `api.stream` (NDJSON)    | `{ method, path, handler }`         | an async iterable of lines               |
| `api.ws`                 | `{ ws: true, path, handler }`       | sets up the connection; optional cleanup |
| tRPC (`createTRPCFetch`) | `{ method, path, handler }`         | a `Response` in tRPC's format            |

::: info Bundle size
The mock code lives in its own entry, `tanstack-fetch/mock` (1.82KB gzip). Apps that never import it ship none of it. `mocks` works on every entry: the `tanstack-fetch` core, `/sse`, `/live`, `/full`, `/trpc` and the framework providers.
:::

## Quick start

```ts
import { createFetch } from 'tanstack-fetch/live'
import { createMocks } from 'tanstack-fetch/mock'
import { getMarketOverviewMock, streamMarketTicksMock } from './mocks/market'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  mocks: createMocks({
    enabled: import.meta.env.VITE_USE_API_MOCK !== 'false',
    delayMs: 300,
    routes: [
      { method: 'GET', path: '/market/overview', handler: getMarketOverviewMock },
      { path: '/market/ticks', sse: true, handler: streamMarketTicksMock },
    ],
  }),
})
```

The rest of your app does not change. `api.get('/market/overview')` returns the mock data, and `api.sse('/market/ticks')` streams the mock events.

## Options

`createMocks(options)` takes:

```ts
type MockOptions = {
  enabled?: boolean // default true; false mocks nothing
  delayMs?: number // simulated latency for every route
  routes: MockRoute[] // first match wins
}
```

Every route accepts:

| Field     | Default | Notes                                                                                |
| --------- | ------- | ------------------------------------------------------------------------------------ |
| `path`    | —       | Relative to `baseUrl`, like the paths you pass to `api.get`. Supports `:id` / `{id}` |
| `enabled` | `true`  | Read on every request, so you can flip it at runtime                                 |
| `delayMs` | —       | Overrides `mocks.delayMs` for this route                                             |
| `method`  | `GET`   | HTTP routes only                                                                     |
| `sse`     | `false` | Match only `api.sse()` requests                                                      |
| `ws`      | `false` | Match only `api.ws()` connections                                                    |

A request with no matching route goes to the real API (your `fetch` / `createWebSocket`, or the globals), so you can mock one endpoint at a time.

## The handler's request

HTTP, SSE and WebSocket handlers all receive the same request object:

```ts
type MockRequest = {
  method: string
  url: URL
  params: Record<string, string> // from :id / {id}
  query: URLSearchParams
  headers: Headers // includes headers your interceptors added (auth, trace, …)
  body: unknown // JSON-parsed when possible, otherwise raw (FormData, Blob, …)
  signal?: AbortSignal
}
```

## HTTP

Return data to send it as JSON with status `200`:

```ts
const getUserMock = ({ params }: MockRequest) => ({ id: params.id, name: 'Ada' })

routes: [{ method: 'GET', path: '/users/:id', handler: getUserMock }]
```

Return a `Response` for any other status, header or body. Errors then work exactly like real ones: status handlers run, retries happen, and `api.get` throws a `FetchError`.

```ts
{
  method: 'POST',
  path: '/login',
  handler: ({ body }) =>
    (body as { password: string }).password === 'secret'
      ? { token: 'mock-token' }
      : Response.json({ message: 'Wrong password' }, { status: 401 }),
}
```

Return `undefined` for a `204 No Content`. A handler can also be `async`.

## Server-Sent Events

Set `sse: true` and return an async generator. Each value you yield becomes one event's `data`:

```ts
async function* streamMarketTicksMock({ signal }: MockRequest) {
  let price = 100
  while (!signal?.aborted) {
    price += Math.random() - 0.5
    yield { symbol: 'BTC', price }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

routes: [{ path: '/market/ticks', sse: true, handler: streamMarketTicksMock }]
```

When the client closes the stream (`break`, `subscription.close()`, unmount in `useSse`), the generator stops and its `finally` block runs.

An SSE route and a plain `GET` route can share a path: SSE requests only match `sse: true` routes, and plain requests only match the others.

::: tip Named events and ids
Yielded values only set `data`. To test `event:` names or `id:` / `Last-Event-ID` resume, return a `Response` whose body is a `text/event-stream` you write yourself.
:::

## NDJSON streams

For `api.stream()`, return an async generator from a normal route. Each value is sent as one JSON line:

```ts
{
  method: 'POST',
  path: '/chat',
  handler: async function* ({ body }) {
    for (const token of ['Hello', ' ', 'world']) {
      yield { token }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  },
}
```

Only async iterables are streamed. A plain array is sent as JSON.

## WebSocket

Set `ws: true`. The handler runs when the socket opens and gets a connection object for the server side:

```ts
type MockWsConnection = {
  send: (data: unknown) => void // push to the client; objects are JSON-stringified
  close: (code?: number, reason?: string) => void
  onMessage: (listener: (data: unknown) => void) => void // frames from the client
}
```

```ts
{
  ws: true,
  path: '/rooms/:id',
  handler: (connection, { params }) => {
    connection.send({ type: 'joined', room: params.id })
    connection.onMessage((message) => connection.send({ type: 'echo', message }))

    const timer = setInterval(() => connection.send({ type: 'ping' }), 5000)
    return () => clearInterval(timer) // runs when the socket closes
  },
}
```

Frames the client sends before the socket opens are delivered to `onMessage` once it opens. Close with a code other than `1000` (e.g. `connection.close(1011)`) to test the reconnect logic.

## Upload

`api.upload()` is a normal `POST` route. `body` is the `FormData`:

```ts
{
  method: 'POST',
  path: '/files',
  handler: ({ body }) => {
    const file = (body as FormData).get('file') as File
    return { name: file.name, size: file.size }
  },
}
```

`onUploadProgress` / `onDownloadProgress` are not called for mocked requests.

## tRPC

`createTRPCFetch` reads the same `mocks`. tRPC parses the body itself, so return a `Response` in the format your link expects. `httpBatchLink` expects an array with one entry per call; `httpLink` expects a single `{ result: { data } }` object:

```ts
const trpcFetch = createTRPCFetch({
  baseUrl: '/api/trpc',
  mocks: createMocks({
    routes: [
      {
        path: '/post.list',
        handler: () => Response.json([{ result: { data: [{ id: 1, title: 'Hello' }] } }]),
      },
    ],
  }),
})
```

## Turning mocks on and off

- **All mocks:** `enabled` in `createMocks()`. Read once, when the client is created. An env var is the usual switch.
- **One route:** `enabled: false` on the route. Read on every request.

```ts
import { createMocks, type MockRoute } from 'tanstack-fetch/mock'

const overview: MockRoute = {
  method: 'GET',
  path: '/market/overview',
  handler: getMarketOverviewMock,
}

const api = createFetch({ baseUrl, mocks: createMocks({ routes: [overview] }) })

// later, e.g. from a dev panel
overview.enabled = false // next request hits the real API
```

Interceptors still run for mocked requests. Auth headers, retries, status handlers, `onLive*` hooks and [DevTools](./plugins) all see them, so a mocked app behaves like the real one.

## DevTools

[DevTools](/examples/devtools) shows mocked requests next to real ones. Mocked rows get a **MOCK** badge, and the detail view shows which route answered (`mock · /market/ticks`). This works for HTTP, SSE, NDJSON and WebSocket.

```ts
import { setupDevtools } from 'tanstack-fetch/devtools'

setupDevtools(api) // mocked entries: entry.mock === '/market/ticks'
```

Mocked HTTP, SSE and NDJSON responses also carry an `x-tanstack-fetch-mock` header with the route path, so your own interceptors can tell them apart.

## Keep mocks out of production

A static `import { createMocks } from 'tanstack-fetch/mock'` puts the mock code (1.82KB) and your fixtures in every build, even with `enabled: false`. Load both with a dynamic import behind the env flag, so production builds leave them out:

```ts
// src/mocks/index.ts
import { createMocks } from 'tanstack-fetch/mock'
export const mocks = createMocks({ routes: [/* … */] })
```

```ts
// src/lib/api.ts
const mocks =
  import.meta.env.VITE_USE_API_MOCK === 'true' ? (await import('../mocks')).mocks : undefined

export const api = createFetch({ baseUrl, mocks })
```

## Mocks or MSW?

[MSW](https://mswjs.io) intercepts requests at the network level (a Service Worker in the browser, request interceptors in Node), so it mocks every HTTP client in your app. `tanstack-fetch/mock` works inside the client instead:

|                                 | `tanstack-fetch/mock`                                       | MSW                                          |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| What it mocks                   | Requests made by this `createFetch` client                  | Any request your app or tests send           |
| Setup                           | One option; no worker file, no `start()`                    | Worker script in the browser, server in Node |
| SSE / NDJSON / WebSocket        | Same route list (`sse: true`, async generators, `ws: true`) | See the MSW docs for its current support     |
| Interceptors, retries, DevTools | Run as for a real request                                   | Run, since the client sends a real request   |
| Bundle                          | 1.82KB, and only when imported                              | Separate package                             |

Use `tanstack-fetch/mock` when your API calls go through tanstack-fetch and you want one list of routes for REST, live streams and sockets. Use MSW when other libraries (a third-party SDK, `axios`, an `<img>` request) also need mocking, or when you want to share handlers across tools that support MSW.

## In tests

Mocks also work in Vitest / Jest, with no extra library to install:

```ts
import { createFetch } from 'tanstack-fetch/live'
import { createMocks } from 'tanstack-fetch/mock'

const api = createFetch({
  baseUrl: 'https://api.test',
  mocks: createMocks({
    routes: [{ path: '/users/:id', handler: ({ params }) => ({ id: params.id }) }],
  }),
})

expect(await api.get('/users/:id', { params: { id: 1 } })).toEqual({ id: '1' })
```
