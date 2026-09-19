# createFetch

![createFetch mental model](/images/docs-mental-model.png)

```ts
import { createFetch } from 'tanstack-fetch'

const api = createFetch(options?)
```

For SSE, import from `tanstack-fetch/sse` instead.

## `CreateFetchOptions`

| Option           | Type                             | Notes                                |
| ---------------- | -------------------------------- | ------------------------------------ |
| `baseUrl`        | `string`                         | Absolute URL required for SSR / Edge |
| `headers`        | `HeadersInit` \| getter          | Merged into every request            |
| `getToken`       | `() => token`                    | Sets Bearer auth                     |
| `auth`           | `{ getToken, header?, scheme? }` | Advanced auth                        |
| `onUnauthorized` | status handler                   | HTTP 401                             |
| `onForbidden`    | status handler                   | HTTP 403                             |
| `onNotFound`     | status handler                   | HTTP 404                             |
| `onServerError`  | status handler                   | HTTP 5xx                             |
| `onStatus`       | status map                       | Exact / `4xx` / `5xx` / `default`    |
| `plugins`        | `PluginName[]`                   | Built-in interceptors                |
| `interceptors`   | `HttpInterceptor[]`              | Custom                               |
| `throwOnError`   | `boolean`                        | Default `true`                       |
| `timeoutMs`      | `number`                         | Per-client timeout                   |
| `maxRetries`     | `number`                         | Retry budget                         |
| `fetch`          | `typeof fetch`                   | Custom fetch / tests                 |
| `credentials`    | `RequestCredentials`             | e.g. `include`                       |
| `source`         | `'browser' \| 'ssr' \| …`        | Runtime hint                         |
| `incoming`       | headers \| getter                | SSR forward input                    |

Deprecated alias: `createClient` → `createFetch`.
