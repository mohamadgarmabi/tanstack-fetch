# Getting started

![tanstack-fetch logo](/images/logo.jpg){width=200}

## Install

<NpmDownloadBadges package-name="tanstack-fetch" />

Peers are optional. Pick the stack you use:

<InstallTabs packages="tanstack-fetch @tanstack/react-query" />

```bash
# Vue / Nuxt
npm install tanstack-fetch vue
# optional Query
npm install @tanstack/vue-query
```

For SSE, React, Vue/Nuxt, or tRPC, import the matching entry — same package.

---

## React quickstart

::: tip Framework
**React** · `@tanstack/react-query`
:::

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

---

## Vue quickstart

::: tip Framework
**Vue 3** · optional `@tanstack/vue-query` · Nuxt-ready
:::

```ts
import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/vue-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

Or inject a shared client with [`tanstack-fetch/vue`](/guide/vue).

![Hero](/images/tanstack-fetch-hero.gif)

## Shared client (recommended)

Framework-agnostic — works in React, Vue, Nuxt, and Next.js.

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
import type { NoParams } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
})

const user = await api.get<User, { id: string | number }>('/users/:id', { params: { id: '1' } })
await api.post<User, NoParams, { name: string }>('/users', { body: { name: 'Ada' } })

try {
  await api.get('/missing')
} catch (error) {
  if (isFetchError(error)) console.log(error.status, error.message)
}
```

::: tip Types

- No generics → `params` from the URL (`:id` / `{id}`)
- `<Data, Params>` → response + params map (path must contain those keys)
- `post` / `put` / `patch`: optional third generic for `body` (`NoParams` skips params)
  :::

## Next steps

| Goal                    | Page                               |
| ----------------------- | ---------------------------------- |
| Cursor / agent skill    | [Agent skill](./skill)             |
| Token + 401 / 403 / 404 | [Configuration](./configuration)   |
| React / Vue Query       | [TanStack Query](./tanstack-query) |
| React helpers           | [React](./react)                   |
| Vue / Nuxt helpers      | [Vue & Nuxt](./vue)                |
| Next.js / Nuxt cookies  | [SSR](./ssr)                       |
| Streams                 | [SSE](./sse)                       |
| tRPC                    | [tRPC](./trpc)                     |
