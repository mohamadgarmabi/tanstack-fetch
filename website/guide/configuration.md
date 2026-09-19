# Configuration

![Auth, token, and status handlers](/images/docs-auth-status.png)

Two paths: **simple** (most apps) and **advanced** (plugins + interceptors).

## Simple path

Set API URL, attach a token, decide what happens on **401 / 403 / 404 / 5xx**.

```ts
import { createFetch } from 'tanstack-fetch'

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
  onServerError: ({ status }) => {
    console.error('Server error', status) // 500–599
  },
})
```

| Option              | When                                               |
| ------------------- | -------------------------------------------------- |
| `getToken` / `auth` | Every request — `Authorization: Bearer …`          |
| `onUnauthorized`    | HTTP **401**                                       |
| `onForbidden`       | HTTP **403**                                       |
| `onNotFound`        | HTTP **404**                                       |
| `onServerError`     | HTTP **5xx**                                       |
| `onStatus`          | Advanced map (exact code, `4xx`, `5xx`, `default`) |

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
    500: () => toast.error('Server error'),
    '5xx': ({ status }) => console.error('upstream', status),
    default: ({ status }) => console.warn('unhandled', status),
  },
})
```

## Advanced path — plugins + interceptors

```ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
  getToken: () => getAccessToken(),
  onUnauthorized: () => logout(),
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

See [Plugins & interceptors](./plugins) for the full list.
