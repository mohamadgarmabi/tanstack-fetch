---
title: Nuxt SSR
description: Nuxt + ssr-forward — forward cookies and auth headers on the server, skip in the browser.
---

# Nuxt SSR

::: tip Framework
**Vue** · Nuxt 3 / 4 · `tanstack-fetch/vue` · `@tanstack/vue-query`
:::

On the server, `ssr-forward` attaches Cookie / Authorization from the incoming request. In the browser the plugin **skips**.

## Plugin

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

## Page with Vue Query

```vue
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'

type User = { id: string; name: string }

const api = useFetchClient()

const { data, isPending, error } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>()('/users', { signal }),
})
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <ul v-else>
    <li v-for="user in data" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Vue Query hydrate (optional)

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

Guide: [SSR](/guide/ssr#nuxt) · [Vue & Nuxt](/guide/vue) · compare: [Next.js SSR](/examples/next-ssr)
