# createFetch

![createFetch mental model](/images/docs-mental-model.png)

```ts
import { createFetch } from 'tanstack-fetch'

const api = createFetch(options?)
```

For SSE, import from `tanstack-fetch/sse` instead.

## `CreateFetchOptions`

| Option                         | Type                             | Notes                                |
| ------------------------------ | -------------------------------- | ------------------------------------ |
| `baseUrl`                      | `string`                         | Absolute URL required for SSR / Edge |
| `headers`                      | `HeadersInit` \| getter          | Merged into every request            |
| `getToken`                     | `() => token`                    | Sets Bearer auth                     |
| `auth`                         | `{ getToken, header?, scheme? }` | Advanced auth                        |
| `onBadRequest`                 | status handler                   | HTTP 400                             |
| `onUnauthorized`               | status handler                   | HTTP 401                             |
| `onForbidden`                  | status handler                   | HTTP 403                             |
| `onNotFound`                   | status handler                   | HTTP 404                             |
| `onMethodNotAllowed`           | status handler                   | HTTP 405                             |
| `onRequestTimeout`             | status handler                   | HTTP 408                             |
| `onConflict`                   | status handler                   | HTTP 409                             |
| `onGone`                       | status handler                   | HTTP 410                             |
| `onPayloadTooLarge`            | status handler                   | HTTP 413                             |
| `onUnsupportedMediaType`       | status handler                   | HTTP 415                             |
| `onUnprocessableEntity`        | status handler                   | HTTP 422                             |
| `onTooManyRequests`            | status handler                   | HTTP **429**                         |
| `onUnavailableForLegalReasons` | status handler                   | HTTP 451                             |
| `onClientError`                | status handler                   | Any other **4xx**                    |
| `onServerError`                | status handler                   | HTTP 5xx                             |
| `onStatus`                     | status map                       | Exact / `4xx` / `5xx` / `default`    |
| `plugins`                      | `PluginName[]`                   | Built-in interceptors                |
| `interceptors`                 | `HttpInterceptor[]`              | Custom                               |
| `throwOnError`                 | `boolean`                        | Default `true`                       |
| `timeoutMs`                    | `number`                         | Per-client timeout                   |
| `maxRetries`                   | `number`                         | Retry budget                         |
| `fetch`                        | `typeof fetch`                   | Custom fetch / tests                 |
| `credentials`                  | `RequestCredentials`             | e.g. `include`                       |
| `source`                       | `'browser' \| 'ssr' \| …`        | Runtime hint                         |
| `incoming`                     | headers \| getter                | SSR forward input                    |

Also exported: `parseRetryAfter(headers)` for **429** `Retry-After` → ms.

## Path-typed `params`

Path placeholders make `params` required and typed (`:id` or `{id}`):

```ts
import { createFetch, pathParams } from 'tanstack-fetch'

const api = createFetch({ baseUrl: 'https://api.example.com' })

// params required — keys inferred from the path
await api.get<User>('/users/:id', { params: { id: '1' } })
await api.get('/users/{id}/posts/{postId}', {
  params: pathParams('/users/{id}/posts/{postId}', { id: 1, postId: 2 }),
})

// no placeholders → params not accepted
await api.get('/users')
```

Helpers / types: `pathParams()`, `PathParamsOf`, `ExtractPathParamKeys`.

Deprecated alias: `createClient` → `createFetch`.
