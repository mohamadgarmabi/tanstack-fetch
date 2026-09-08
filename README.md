# typed-ssr-http

Typed `fetch` client for React and Next.js. Works in the browser, SSR, and Edge. JSON and SSE share one client, named interceptors, and an OpenAPI generator.

## Install

```bash
npm install typed-ssr-http
```

Node 18+ (native `fetch`).

## HTTP

```ts
import { createClient } from 'typed-ssr-http'

const http = createClient({
  baseUrl: 'https://api.example.com',
  source: 'ssr',
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
  incoming: async () => ({
    cookie: (await cookies()).toString(),
  }),
})

const result = await http.get<User>('/users/:id', { params: { id: '1' } })

if (result.ok) {
  result.data
} else {
  result.status
  result.error.code
}
```

`Result` is the default. Set `throwOnError: true` if you want exceptions.

## Interceptors

Named, ordered, and removable. Seniors can customize HTTP, SSE, and SSR separately.

```ts
http.use('auth', {
  order: 20,
  onRequest: async (context) => {
    context.request.headers.set('authorization', `Bearer ${await getToken()}`)
    return { action: 'continue', context }
  },
  onResponseError: async (context) => {
    if (context.error?.status !== 401 || context.meta.attempt > 0) {
      return { action: 'continue', context }
    }
    await refreshToken()
    return { action: 'retry' }
  },
})

http.eject('auth')

await http.get('/public', {
  interceptors: { eject: ['auth'] },
})
```

Actions: `continue`, `skip`, `drop` (SSE heartbeat), `retry`, `short-circuit`.

Hooks: `onRequest`, `onRequestError`, `onResponse`, `onResponseError`, `onSseOpen`, `onSseEvent`, `onSseError`, `onSseReconnect`.

Built-in plugins: `trace`, `ssr-forward`, `retry-idempotent`, `sse-resume`.

## SSE

Uses `fetch` + stream, not `EventSource`, so Authorization and SSR work.

```ts
for await (const event of http.sse<OrderEvent>('/events')) {
  event.event
  event.data
  event.id
}
```

## OpenAPI CLI

```bash
npx typed-ssr-http generate --spec ./openapi.yaml --out ./src/api
```

Writes `types.ts`, `client.ts`, and `index.ts`. `text/event-stream` operations become `http.sse()`.

```ts
import { createApi } from './api'

const api = createApi({ baseUrl: process.env.API_URL, source: 'ssr' })
const user = await api.users.getUser({ params: { id: '1' } })
```

## Example

```bash
npm run example
```

## Publish

```bash
npm run build
npm publish --access public
```
