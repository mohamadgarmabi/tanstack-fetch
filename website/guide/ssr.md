# SSR

![SSR cookie forwarding with ssr-forward](/images/docs-ssr-forward.png)

Forward cookies and auth headers from the incoming server request. Same `createFetch` client in the browser — `ssr-forward` skips on the client.

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

Use absolute `baseUrl` on the server and the `ssr-forward` plugin.

```ts
import { createFetch } from 'tanstack-fetch'
import { cookies } from 'next/headers'

export const api = createFetch({
  baseUrl: process.env.API_URL, // absolute in SSR
  source: 'ssr',
  plugins: ['ssr-forward', 'trace', 'retry-idempotent'],
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

Example: [Next.js SSR](/examples/next-ssr) · repo: [`examples/next-ssr`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)

---

## Nuxt

::: tip Framework
**Vue** · Nuxt 3 / 4 · `@tanstack/vue-query`
:::

Create a server-aware client in a Nuxt plugin (or a shared `server/utils` module). Read cookies from `useRequestHeaders` / `useCookie` on the server.

```ts
// plugins/tanstack-fetch.ts
import { createFetch } from 'tanstack-fetch'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const api = createFetch({
    baseUrl: config.public.apiBase as string,
    source: import.meta.server ? 'ssr' : 'client',
    plugins: ['ssr-forward', 'trace', 'retry-idempotent'],
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

```ts
// pages/users.vue
<script setup lang="ts">
import { useQuery, dehydrate, hydrate } from '@tanstack/vue-query'
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'

const api = useFetchClient()

const { data } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

if (import.meta.server) {
  // Prefetch runs on the server; dehydrate state into the payload
}
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

Example: [Nuxt SSR](/examples/nuxt-ssr) · Vue helpers: [Vue & Nuxt](/guide/vue)
