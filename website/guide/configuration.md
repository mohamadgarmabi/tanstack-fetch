# Configuration

![Auth, token, and status handlers](/images/docs-auth-status.png)

Two paths: **simple** (most apps) and **advanced** (plugins + interceptors).

<StatusPlayground />

## Simple path

Set API URL, attach a token, decide what happens on **4xx / 5xx** — including **429**.

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),

  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login' // 401
  },
  onForbidden: () => {
    console.warn('No permission') // 403
  },
  onNotFound: ({ error }) => {
    console.warn('Missing resource', error.message) // 404
  },
  onTooManyRequests: ({ context }) => {
    const waitMs = parseRetryAfter(context.response?.headers, 1000)
    console.warn('Rate limited — retry in', waitMs, 'ms') // 429
  },
  onClientError: ({ status }) => {
    console.warn('Other 4xx', status) // any 4xx without its own shortcut
  },
  onServerError: ({ status }) => {
    console.error('Server error', status) // 500–599
  },
})
```

### Status shortcuts

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

### Advanced `auth` + `onStatus`

```ts
createFetch({
  baseUrl: 'https://api.example.com',
  auth: {
    getToken: async () => (await cookies()).get('token')?.value,
    header: 'authorization',
    scheme: 'Bearer', // use '' for a raw token / API key
  },
  onStatus: {
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
  },
})
```

## Advanced path — plugins + interceptors

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
  getToken: () => getAccessToken(),
  onUnauthorized: () => logout(),
  onTooManyRequests: ({ context }) => ({
    action: 'retry',
    delayMs: parseRetryAfter(context.response?.headers, 2000),
  }),
  interceptors: [
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
