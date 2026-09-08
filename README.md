# ssrfetch

Typed `fetch` client for React and Next.js.

Works in the **browser**, **SSR**, and **Edge**. One client for JSON HTTP and SSE. Named interceptors, built-in plugins, and an OpenAPI codegen CLI.

```bash
npm install ssrfetch
```

Requires Node 18+ (native `fetch`).

---

## Quick start

```ts
import { createClient } from 'ssrfetch'

const http = createClient({
  baseUrl: 'https://api.example.com',
})

const result = await http.get<User>('/users/:id', {
  params: { id: '1' },
})

if (result.ok) {
  console.log(result.data)
} else {
  console.error(result.status, result.error.code, result.error.message)
}
```

---

## Create a client

```ts
import { createClient } from 'ssrfetch'
import { cookies } from 'next/headers'

const http = createClient({
  baseUrl: 'https://api.example.com',
  source: 'ssr', // 'browser' | 'ssr' | 'edge'
  timeoutMs: 15_000,
  maxRetries: 2,
  throwOnError: false,
  credentials: 'include',
  headers: {
    'x-app': 'web',
  },
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
  incoming: async () => ({
    cookie: (await cookies()).toString(),
  }),
})
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | — | API origin. Required for SSR/Edge (must be absolute). |
| `source` | `'browser' \| 'ssr' \| 'edge'` | `'browser'` | Where the client runs. |
| `headers` | `HeadersInit \| () => ...` | — | Default headers (static or async). |
| `incoming` | object \| async fn | — | Cookie / auth / request-id from the server request. |
| `plugins` | `PluginName[]` | `[]` | Built-in interceptors by name. |
| `interceptors` | `HttpInterceptor[]` | `[]` | Custom interceptors at create time. |
| `timeoutMs` | `number` | `30000` | Per-request timeout. |
| `maxRetries` | `number` | `2` | Retry budget for interceptors that return `retry`. |
| `throwOnError` | `boolean` | `false` | Throw instead of returning `Result`. |
| `credentials` | `RequestCredentials` | — | Passed to `fetch`. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch (tests, polyfills). |

---

## HTTP methods

```ts
await http.get<User[]>('/users')
await http.get<User>('/users/:id', { params: { id: '42' } })
await http.get<User[]>('/users', { query: { page: 1, active: true } })

await http.post<User>('/users', {
  body: { name: 'Ada', email: 'ada@example.com' },
})

await http.put<User>('/users/:id', {
  params: { id: '42' },
  body: { name: 'Ada Lovelace' },
})

await http.patch<User>('/users/:id', {
  params: { id: '42' },
  body: { email: 'ada@lovelace.dev' },
})

await http.delete<void>('/users/:id', {
  params: { id: '42' },
})

// Any method
await http.request<User>('GET', '/users/:id', { params: { id: '1' } })
```

### Path params, query, body, headers

```ts
await http.get('/orgs/:orgId/users/:userId', {
  params: { orgId: 'acme', userId: 7 },
  query: {
    include: 'roles',
    limit: 20,
    draft: undefined, // omitted from the URL
  },
  headers: {
    'x-locale': 'en',
  },
  timeoutMs: 5_000,
  parseAs: 'json', // 'json' | 'text' | 'blob'
})
```

Path templates use `:param` style:

```ts
// → https://api.example.com/users/1?page=2
await http.get('/users/:id', {
  params: { id: '1' },
  query: { page: 2 },
})
```

---

## Result type (default)

By default every call returns a discriminated union — no try/catch required:

```ts
type HttpResult<T, E = HttpError> =
  | { ok: true; status: number; data: T; headers: Headers }
  | { ok: false; status: number; error: E; headers: Headers }

type HttpError = {
  status: number
  code: string
  message: string
  body: unknown
}
```

```ts
const result = await http.get<User>('/users/1')

if (result.ok) {
  result.data.name
} else {
  result.error.code // e.g. 'NOT_FOUND'
  result.error.message
  result.error.body
}
```

### Throw on error

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  throwOnError: true,
})

try {
  const result = await http.get<User>('/users/1')
  // result.ok is true here
  console.log(result.data)
} catch (error) {
  // network / HTTP failure
}
```

Or per request:

```ts
await http.get('/users/1', { throwOnError: true })
```

---

## Plugins

Plugins are **built-in interceptors**. Pass names to `createClient` — no boilerplate.

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  source: 'ssr',
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
})
```

You can also import a factory and register it yourself:

```ts
import {
  createClient,
  createTraceInterceptor,
  createSsrForwardInterceptor,
} from 'ssrfetch'

const http = createClient({ baseUrl: 'https://api.example.com' })
http.use('trace', createTraceInterceptor())
http.use('ssr-forward', createSsrForwardInterceptor())
```

### `trace`

Adds `x-request-id` to every request (from `incoming.requestId`, or a new UUID).

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  plugins: ['trace'],
  incoming: { requestId: 'req-from-gateway-123' },
})

await http.get('/users')
// Request header: x-request-id: req-from-gateway-123
```

Without `incoming.requestId`:

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  plugins: ['trace'],
})

await http.get('/users')
// Request header: x-request-id: <random-uuid>
```

### `ssr-forward`

On **SSR / Edge**, forwards cookie, authorization, and request-id from `incoming` onto the outbound request. On **browser**, it skips (does nothing).

```ts
// Next.js App Router — Server Component / Route Handler
import { cookies, headers } from 'next/headers'
import { createClient } from 'ssrfetch'

const http = createClient({
  baseUrl: process.env.API_URL,
  source: 'ssr',
  plugins: ['ssr-forward', 'trace'],
  incoming: async () => {
    const jar = await cookies()
    const h = await headers()
    return {
      cookie: jar.toString(),
      authorization: h.get('authorization') ?? undefined,
      requestId: h.get('x-request-id') ?? undefined,
    }
  },
})

const me = await http.get<User>('/me')
// Outbound request includes Cookie / Authorization from the browser → Next → API hop
```

Browser client (plugin is a no-op):

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  source: 'browser',
  plugins: ['ssr-forward'], // safely ignored in the browser
})
```

### `retry-idempotent`

Retries **idempotent** methods (`GET`, `HEAD`, `OPTIONS`) when the status is `502`, `503`, or `504`. Backoff: `200ms * (attempt + 1)`.

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  plugins: ['retry-idempotent'],
  maxRetries: 2,
})

// GET may retry on 503
await http.get('/health')

// POST is not retried by this plugin
await http.post('/orders', { body: { sku: 'ABC' } })
```

### `sse-resume`

For SSE streams:

1. Drops `ping` / `heartbeat` events so your loop only sees real data.
2. On reconnect, sends `Last-Event-ID` from the last received event.

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
})

for await (const event of http.sse<OrderEvent>('/orders/stream')) {
  // ping / heartbeat never reach here
  console.log(event.id, event.event, event.data)
}
```

---

## Interceptors

Named, ordered, matchable, and removable. Same pipeline for HTTP and SSE.

### Add / replace / remove

```ts
http.use('auth', {
  order: 20,
  onRequest: async (context) => {
    context.request.headers.set('authorization', `Bearer ${await getToken()}`)
    return { action: 'continue', context }
  },
})

// Same name replaces the previous one
http.use('auth', { onRequest: () => ({ action: 'continue' }) })

http.eject('auth')
```

### Per-request interceptors

```ts
// Skip auth for a public route
await http.get('/public/config', {
  interceptors: { eject: ['auth'] },
})

// Add a one-off interceptor for this call only
await http.get('/admin', {
  interceptors: {
    use: [
      {
        name: 'admin-flag',
        onRequest: (context) => {
          context.request.headers.set('x-admin', '1')
          return { action: 'continue', context }
        },
      },
    ],
  },
})
```

### Auth + refresh example

```ts
let token = await loadToken()

http.use('auth', {
  order: 20,
  onRequest: (context) => {
    context.request.headers.set('authorization', `Bearer ${token}`)
    return { action: 'continue', context }
  },
  onResponseError: async (context) => {
    if (context.error?.status !== 401 || context.meta.attempt > 0) {
      return { action: 'continue', context }
    }
    token = await refreshToken()
    return { action: 'retry' }
  },
})
```

### Logging example

```ts
http.use('log', {
  order: 5,
  onRequest: (context) => {
    console.log('→', context.request.method, context.request.url.href)
    return { action: 'continue', context }
  },
  onResponse: (context) => {
    console.log('←', context.response?.status, context.request.url.pathname)
    return { action: 'continue', context }
  },
  onResponseError: (context) => {
    console.error('✗', context.error?.status, context.error?.code)
    return { action: 'continue', context }
  },
})
```

### Mock / short-circuit example

Skip the network entirely (useful in Storybook or tests):

```ts
http.use('mock-users', {
  match: { pathPrefix: '/users' },
  onRequest: () => ({
    action: 'short-circuit',
    result: {
      ok: true,
      status: 200,
      data: [{ id: '1', name: 'Ada' }],
      headers: new Headers(),
    },
  }),
})

const users = await http.get('/users')
// fetch is never called
```

### Match filters

Only run when the request matches:

```ts
http.use('billing-only', {
  match: {
    pathPrefix: '/billing',
    method: 'POST',
    // operation: 'createInvoice', // if you set options.operation
    // status: 402,               // for response hooks
  },
  onRequest: (context) => {
    context.request.headers.set('x-billing-version', '2')
    return { action: 'continue', context }
  },
})

await http.post('/billing/invoices', {
  body: { amount: 10 },
  operation: 'createInvoice',
})
```

### Actions

| Action | Meaning |
| --- | --- |
| `continue` | Keep going (optionally with an updated `context`). |
| `skip` | Skip **this** interceptor; continue the chain. |
| `drop` | SSE only — discard the event (e.g. heartbeat). |
| `retry` | Retry the request (`delayMs` optional). |
| `short-circuit` | Return a `HttpResult` immediately; no network. |

### Hooks

| Hook | When |
| --- | --- |
| `onRequest` | Before `fetch` |
| `onRequestError` | Request setup / network failure before a response |
| `onResponse` | After a successful HTTP response |
| `onResponseError` | After an HTTP error response |
| `onSseOpen` | SSE stream opened |
| `onSseEvent` | Each SSE event |
| `onSseError` | SSE error |
| `onSseReconnect` | Before SSE reconnect |

`order` defaults to `100`. Lower runs earlier on the way in.

---

## Next.js SSR

```ts
// lib/http.ts
import { createClient } from 'ssrfetch'
import { cookies } from 'next/headers'

export const createServerHttp = async () =>
  createClient({
    baseUrl: process.env.API_URL!,
    source: 'ssr',
    plugins: ['trace', 'ssr-forward', 'retry-idempotent'],
    incoming: async () => ({
      cookie: (await cookies()).toString(),
    }),
  })
```

```tsx
// app/users/page.tsx
import { createServerHttp } from '#/lib/http'

const UsersPage = async () => {
  const http = await createServerHttp()
  const result = await http.get<User[]>('/users')

  if (!result.ok) {
    return <p>Failed: {result.error.message}</p>
  }

  return (
    <ul>
      {result.data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}

export default UsersPage
```

### Browser client

```ts
'use client'

import { createClient } from 'ssrfetch'

export const browserHttp = createClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  source: 'browser',
  credentials: 'include',
  plugins: ['trace', 'retry-idempotent', 'sse-resume'],
})

browserHttp.use('auth', {
  onRequest: (context) => {
    const token = localStorage.getItem('token')
    if (token) {
      context.request.headers.set('authorization', `Bearer ${token}`)
    }
    return { action: 'continue', context }
  },
})
```

---

## SSE

Uses `fetch` + streaming (not `EventSource`), so **Authorization**, cookies, and SSR all work.

```ts
const http = createClient({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume', 'trace'],
})

http.use('auth', {
  onRequest: (context) => {
    context.request.headers.set('authorization', `Bearer ${getToken()}`)
    return { action: 'continue', context }
  },
})

for await (const event of http.sse<OrderEvent>('/orders/stream', {
  query: { accountId: '42' },
})) {
  console.log(event.event) // e.g. 'order.updated'
  console.log(event.data) // typed OrderEvent
  console.log(event.id) // for resume
}
```

Custom SSE interceptor:

```ts
http.use('sse-log', {
  onSseOpen: (context) => {
    console.log('stream open', context.request.url.href)
    return { action: 'continue', context }
  },
  onSseEvent: (context) => {
    if (context.event.event === 'debug') {
      return { action: 'drop' }
    }
    return { action: 'continue', context }
  },
  onSseReconnect: (context) => {
    console.log('reconnecting, last id', context.meta.lastEventId)
    return { action: 'continue', context }
  },
})
```

With AbortSignal:

```ts
const controller = new AbortController()

const loop = (async () => {
  for await (const event of http.sse('/events', { signal: controller.signal })) {
    console.log(event.data)
  }
})()

// later
controller.abort()
await loop
```

---

## OpenAPI CLI

Generate a typed API client from OpenAPI / Swagger (JSON or YAML):

```bash
npx ssrfetch generate --spec ./openapi.yaml --out ./src/api
```

Writes:

- `types.ts` — schemas from `components.schemas`
- `client.ts` — `createApi()` grouped by tags
- `index.ts` — re-exports

`text/event-stream` responses become `http.sse()`.

### Spec snippet

```yaml
paths:
  /users/{id}:
    get:
      operationId: getUser
      tags: [users]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
  /events:
    get:
      operationId: streamEvents
      tags: [events]
      responses:
        '200':
          content:
            text/event-stream:
              schema:
                $ref: '#/components/schemas/OrderEvent'
```

### Generated usage

```ts
import { createApi } from './api'

const api = createApi({
  baseUrl: process.env.API_URL,
  source: 'ssr',
  plugins: ['ssr-forward', 'trace'],
})

const user = await api.users.getUser({ params: { id: '1' } })
if (user.ok) {
  console.log(user.data)
}

for await (const event of api.events.streamEvents()) {
  console.log(event.data)
}
```

---

## Try the local example

```bash
npm run example
```

Starts a tiny demo server, creates a client with plugins + a `log` interceptor, then runs HTTP + SSE calls.

---

## API surface

```ts
import {
  createClient,
  createTraceInterceptor,
  createSsrForwardInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
} from 'ssrfetch'

import type {
  CreateClientOptions,
  HttpClient,
  HttpError,
  HttpInterceptor,
  HttpMethod,
  HttpResult,
  IncomingHeaders,
  PluginName,
  RequestContext,
  RequestOptions,
  SseEvent,
} from 'ssrfetch'
```

| Client method | Description |
| --- | --- |
| `get` / `post` / `put` / `patch` / `delete` | Typed HTTP helpers |
| `request(method, path, options?)` | Generic method |
| `sse(path, options?)` | Async iterable of SSE events |
| `use(name, interceptor)` | Register / replace interceptor |
| `eject(name)` | Remove interceptor |

---

## License

MIT
# ssrfetch
