# Getting started

![tanstack-fetch logo](/images/logo.jpg){width=200}

## Install

<NpmDownloadBadges package-name="tanstack-fetch" />

```bash
npm install tanstack-fetch @tanstack/react-query
```

React / YAML peers are optional. For SSE, React helpers, or tRPC, import the matching entry — same package.

## 30-second quickstart

```ts
import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

That’s it: returns data, throws `FetchError` on HTTP errors, honors Query’s `signal`.

![Hero](/images/tanstack-fetch-hero.gif)

## Shared client (recommended)

```ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
  plugins: ['trace', 'retry-idempotent'],
})
```

## Quick taste

```ts
import { createFetch, isFetchError } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})

const user = await api.get<User>('/users/:id', { params: { id: '1' } })

try {
  await api.get('/missing')
} catch (error) {
  if (isFetchError(error)) console.log(error.status, error.message)
}
```

## Next steps

| Goal                        | Page                               |
| --------------------------- | ---------------------------------- |
| Token + 401 / 403 / 404     | [Configuration](./configuration)   |
| `useQuery` / `queryOptions` | [TanStack Query](./tanstack-query) |
| Next.js cookies             | [SSR & Next.js](./ssr)             |
| Streams                     | [SSE](./sse)                       |
| tRPC                        | [tRPC](./trpc)                     |
