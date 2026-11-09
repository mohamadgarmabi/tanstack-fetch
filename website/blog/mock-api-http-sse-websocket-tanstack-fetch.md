---
title: 'Mock your API in the client: HTTP, SSE and WebSocket with tanstack-fetch'
titleTemplate: false
description: 'Build a frontend before the backend is ready. Step by step, mock a REST endpoint, a live SSE price feed, a streaming NDJSON chat and a WebSocket room with the tanstack-fetch mocks option, then turn each mock off as the real API ships.'
date: 2026-11-09
category: Tutorials
tags: ['Mocking', 'SSE', 'WebSocket', 'Testing']
cover: /images/blog-mock-api-http-sse-websocket-tanstack-fetch-cover.jpg
---

# Mock your API in the client: HTTP, SSE and WebSocket

<p class="blog-meta">November 9, 2026 · Mocking · SSE · WebSocket</p>

![Mock your API in the client: HTTP, SSE and WebSocket with tanstack-fetch](/images/blog-mock-api-http-sse-websocket-tanstack-fetch-cover.jpg)

::: tip Stack
`tanstack-fetch/live` · any framework · optional `@tanstack/react-query`
:::

The design is approved, the sprint has started, and the backend is two weeks behind. You can wait, hard-code data into components, or run a separate mock server. All three have a cost:

- **Hard-coded data** skips the loading, error and retry paths, which are exactly the parts that break later.
- **A mock server** is one more process to run, and most of them stop at REST. A live price feed over SSE or a chat over WebSocket is up to you.
- **Service-worker mocks** need extra setup per environment, and streaming support varies.

tanstack-fetch has a `mocks` option that answers requests inside the client. The mock code ships in its own entry, `tanstack-fetch/mock` (1.82KB gzip), so apps that don't use it pay nothing. It covers every transport the client speaks: HTTP, SSE, NDJSON streams, WebSocket, upload and tRPC. Your interceptors keep running, and each route has its own on/off switch, so you can replace mocks with the real API one endpoint at a time.

We'll build the data layer of a small trading dashboard:

1. A REST endpoint: market overview
2. A live SSE feed: price ticks
3. A streaming NDJSON endpoint: an AI market summary
4. A WebSocket room: trader chat
5. Errors and latency
6. Switching to the real API, one route at a time

## 1. One client, one switch

Put the mocks next to the client you already have:

```ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch/live'
import { createMocks } from 'tanstack-fetch/mock'
import { routes } from '../mocks'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('token'),
  mocks: createMocks({
    enabled: import.meta.env.VITE_USE_API_MOCK !== 'false',
    delayMs: 250, // feel the loading states
    routes,
  }),
})
```

`VITE_USE_API_MOCK=false` turns every mock off. Requests that no route matches always go to the real API, so you only mock what is missing.

## 2. A REST endpoint

```ts
// src/mocks/market.ts
import type { MockRequest } from 'tanstack-fetch/mock'

export const getMarketOverviewMock = ({ query }: MockRequest) => ({
  currency: query.get('currency') ?? 'USD',
  markets: [
    { symbol: 'BTC', price: 67_250, change: 1.8 },
    { symbol: 'ETH', price: 3_410, change: -0.4 },
  ],
})
```

```ts
// src/mocks/index.ts
import type { MockRoute } from 'tanstack-fetch/mock'
import { getMarketOverviewMock } from './market'

export const routes: MockRoute[] = [
  { method: 'GET', path: '/market/overview', handler: getMarketOverviewMock },
]
```

The component code is the same as it will be in production:

```ts
useQuery({
  queryKey: ['market', 'overview'],
  queryFn: ({ signal }) => api.get<MarketOverview>('/market/overview', { signal }),
})
```

The handler gets `params` (from `:id` segments), `query`, the JSON-parsed `body`, and the `headers`, including the `authorization` header your `getToken` added. A mocked request goes through the same interceptors as a real one.

## 3. A live SSE feed

Set `sse: true` and write an async generator. Each value you yield becomes one event:

```ts
export async function* streamMarketTicksMock({ query, signal }: MockRequest) {
  const symbol = query.get('symbol') ?? 'BTC'
  let price = 67_250
  try {
    while (!signal?.aborted) {
      price += (Math.random() - 0.5) * 50
      yield { symbol, price: Math.round(price), at: Date.now() }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  } finally {
    console.log('ticks stream closed') // runs when the client unsubscribes
  }
}
```

```ts
{ path: '/market/ticks', sse: true, handler: streamMarketTicksMock },
```

Subscribe the usual way:

```tsx
const { data: tick, status } = useSse<Tick>('/market/ticks', { query: { symbol: 'BTC' } })
```

When the component unmounts, the stream closes and the generator's `finally` block runs, so mock timers don't leak.

An SSE route can share a path with a plain `GET` route. `api.sse('/market/ticks')` only matches the `sse: true` route, and `api.get('/market/ticks')` matches the other one.

## 4. A streaming NDJSON response

AI endpoints often stream JSON lines. A normal route whose handler is an async generator is streamed as NDJSON to `api.stream()`:

```ts
{
  method: 'POST',
  path: '/market/summary',
  handler: async function* ({ body }) {
    const { symbol } = body as { symbol: string }
    const words = `${symbol} is trading above its weekly average on strong volume.`.split(' ')
    for (const word of words) {
      yield { token: `${word} ` }
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
  },
},
```

```ts
let text = ''
for await (const { token } of api.stream<{ token: string }>('/market/summary', {
  body: { symbol: 'BTC' },
})) {
  text += token
  setSummary(text)
}
```

## 5. A WebSocket room

WebSocket routes get a small server-side connection: `send`, `close` and `onMessage`. Return a function to clean up when the socket closes.

```ts
{
  ws: true,
  path: '/rooms/:room',
  handler: (connection, { params }) => {
    connection.send({ type: 'system', text: `Welcome to #${params.room}` })

    connection.onMessage((message) => {
      const { text } = message as { text: string }
      connection.send({ type: 'message', from: 'you', text })
      setTimeout(() => connection.send({ type: 'message', from: 'bot', text: `echo: ${text}` }), 400)
    })

    const presence = setInterval(
      () => connection.send({ type: 'presence', online: 3 + Math.floor(Math.random() * 5) }),
      5000,
    )
    return () => clearInterval(presence)
  },
},
```

```ts
const socket = api.ws('/rooms/:room', {
  params: { room: 'btc' },
  onMessage: (event) => addEvent(event as ChatEvent),
})

socket.send({ text: 'gm' }) // queued until open, then delivered to onMessage
```

Want to test reconnects? Call `connection.close(1011)`. Any code other than `1000` makes the client back off and reconnect, which runs your handler again.

## 6. Errors and latency

The happy path is the easy part. Return a `Response` to test the rest:

```ts
let calls = 0

export const routes: MockRoute[] = [
  // a flaky endpoint: the first call fails with 503 (retried with plugins: ['retry-idempotent'])
  {
    method: 'GET',
    path: '/portfolio',
    handler: () =>
      ++calls === 1
        ? new Response('Service Unavailable', { status: 503 })
        : { total: 12_400, positions: 4 },
  },
  // rate limit: your onTooManyRequests handler and parseRetryAfter see it
  {
    method: 'POST',
    path: '/orders',
    delayMs: 800,
    handler: () =>
      Response.json({ message: 'Slow down' }, { status: 429, headers: { 'retry-after': '2' } }),
  },
  // session expired: your onUnauthorized / refresh-token logic runs
  {
    method: 'GET',
    path: '/me',
    handler: ({ headers }) =>
      headers.get('authorization') === 'Bearer fresh'
        ? { name: 'Ada' }
        : Response.json({ message: 'expired' }, { status: 401 }),
  },
]
```

Since mocks replace only the transport, every status handler, retry policy and plugin runs as it would against the real server. You test the code you will ship.

## 7. Switching to the real API, one route at a time

The backend ships `/market/overview` first. Turn that one mock off and keep the rest:

```ts
{ method: 'GET', path: '/market/overview', handler: getMarketOverviewMock, enabled: false },
```

`enabled` is read on every request, so you can also flip it at runtime, for example from a small dev panel:

```ts
routes.forEach((route) => {
  route.enabled = devPanel.isMocked(route.path)
})
```

When the last route is off, delete the mocks folder. Your components and queries don't change.

## Keep the fixtures out of production

A static import puts `tanstack-fetch/mock` and every fixture in the production bundle, even with `enabled: false`. Move `createMocks` into the mocks folder and load it behind the flag, so the bundler drops both:

```ts
// src/mocks/index.ts
import { createMocks } from 'tanstack-fetch/mock'
export const mocks = createMocks({ delayMs: 250, routes })
```

```ts
// src/lib/api.ts
const mocks =
  import.meta.env.VITE_USE_API_MOCK === 'true' ? (await import('../mocks')).mocks : undefined

export const api = createFetch({ baseUrl, getToken, mocks })
```

## The same mocks in your tests

The routes are plain objects, so you can reuse them in Vitest:

```ts
import { createFetch } from 'tanstack-fetch/live'
import { createMocks } from 'tanstack-fetch/mock'
import { routes } from '../src/mocks'

it('renders the overview', async () => {
  const api = createFetch({ baseUrl: 'https://api.test', mocks: createMocks({ routes }) })
  const overview = await api.get('/market/overview')
  expect(overview.markets).toHaveLength(2)
})
```

## Recap

| Need                    | Route                                            |
| ----------------------- | ------------------------------------------------ |
| REST response           | `{ method, path, handler: () => data }`          |
| Error / custom status   | `handler: () => new Response(…, { status })`     |
| Live events (SSE)       | `{ path, sse: true, handler: async function* }`  |
| Streaming JSON (NDJSON) | `{ method, path, handler: async function* }`     |
| WebSocket               | `{ ws: true, path, handler: (connection) => … }` |
| Slow network            | `delayMs` on the route or on `mocks`             |
| Turn one mock off       | `enabled: false`                                 |
| Turn every mock off     | `createMocks({ enabled: false, … })`             |

Full reference: [Mocking API routes](/guide/mocking).
