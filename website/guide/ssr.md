---
title: SSR
description: Forward cookies and auth headers with ssr-forward in Next.js and Nuxt — same createFetch client on server and browser.
---

# SSR

![SSR cookie forwarding with ssr-forward](/images/docs-ssr-forward.png)

Forward cookies and auth headers from the incoming server request. Same `createFetch` client in the browser — `ssr-forward` skips when `source` is `'browser'`.

## Live demo

::: tip Framework
**Next.js** (App Router) · simulated server `incoming` in the browser
:::

<NextSsrDemo />

---

## Next.js

::: tip Framework
**React** · Next.js App Router · `@tanstack/react-query`
:::

Use an absolute `baseUrl` on the server and the `ssr-forward` interceptor.

```ts
import { createFetch } from 'tanstack-fetch'
import {
  createRetryIdempotentInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { cookies } from 'next/headers'

export const api = createFetch({
  baseUrl: process.env.API_URL, // absolute in SSR
  source: 'ssr',
  interceptors: [
    createSsrForwardInterceptor(),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
  incoming: async () => {
    const jar = await cookies()
    return { cookie: jar.toString() }
  },
})
```

### Prefetch + hydrate

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { usersQueryOptions } from '@/queries/users'

export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.query(usersQueryOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient />
    </HydrationBoundary>
  )
}
```

Example: [Next.js SSR](/examples/next-ssr) · repo: [`examples/next-ssr`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr) · Blog: [Next.js fetch vs tanstack-fetch](/blog/nextjs-fetch-tanstack-fetch)

## Why cookies don't forward by default

Next.js App Router `fetch()` runs in a server context with a clean request — browser cookies are not piped automatically. Without `ssr-forward`, your server `queryFn` sees no auth and returns 401 or empty data, even though the browser has the cookie.

This is the most common SSR failure for TanStack Query + Next.js apps.

---

## Nuxt

::: tip Framework
**Vue** · Nuxt 3 / 4 · `@tanstack/vue-query`
:::

Create a server-aware client in a Nuxt plugin (or a shared `server/utils` module). Read cookies from `useRequestHeaders` on the server.

```ts
// plugins/tanstack-fetch.ts
import { createFetch } from 'tanstack-fetch'
import {
  createRetryIdempotentInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const api = createFetch({
    baseUrl: config.public.apiBase as string,
    source: import.meta.server ? 'ssr' : 'browser',
    interceptors: [
      createSsrForwardInterceptor(),
      createTraceInterceptor(),
      createRetryIdempotentInterceptor(),
    ],
    incoming: () => {
      if (!import.meta.server) return undefined
      const headers = useRequestHeaders(['cookie', 'authorization', 'x-request-id'])
      return {
        cookie: headers.cookie,
        authorization: headers.authorization,
        requestId: headers['x-request-id'],
      }
    },
  })

  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
  return { provide: { api } }
})
```

### Prefetch + hydrate (Vue Query)

```vue
<!-- pages/users.vue -->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'

const api = useFetchClient()

const { data, suspense } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

// Prefetch on the server; the state is dehydrated into the payload below
await suspense()
</script>
```

Typical Nuxt + Vue Query setup:

```ts
// plugins/vue-query.ts
import { VueQueryPlugin, QueryClient, dehydrate, hydrate } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient()

  if (import.meta.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      nuxtApp.payload.vueQueryState = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    hydrate(queryClient, nuxtApp.payload.vueQueryState)
  }

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })
})
```

Example: [Nuxt SSR](/examples/nuxt-ssr) · Vue helpers: [Vue & Nuxt](/guide/vue) · Blog: [Nuxt $fetch vs tanstack-fetch](/blog/nuxt-ofetch-tanstack-fetch)
