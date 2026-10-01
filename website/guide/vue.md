# Vue & Nuxt

::: tip Framework
**Vue 3 / Nuxt** · `tanstack-fetch/vue` · optional `@tanstack/vue-query`
:::

Helpers from `tanstack-fetch/vue`. Same client as React — plugin + composables instead of context.

In Nuxt, core `useFetch` already exists. Import ours as `useFetchClient` if the names clash:

```ts
import { useFetch as useFetchClient, useSse } from 'tanstack-fetch/vue'
```

## Install

```bash
npm install tanstack-fetch vue
# or with Nuxt
npm install tanstack-fetch
```

`vue` is an optional peer (`>=3.3`).

## Shared client (plugin)

### Vue

```ts
import { createApp } from 'vue'
import { createFetch } from 'tanstack-fetch'
import { createFetchPlugin, useFetch } from 'tanstack-fetch/vue'
import App from './App.vue'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
})

createApp(App)
  .use(createFetchPlugin({ client: api }))
  .mount('#app')
```

```vue
<script setup lang="ts">
import { useFetch } from 'tanstack-fetch/vue'
import { isFetchError } from 'tanstack-fetch'

const api = useFetch()

const users = await api.get<User[]>('/users')
</script>
```

You can also pass `createFetch` options straight into the plugin (`baseUrl`, `getToken`, …) and skip building `api` yourself.

### Nuxt

```ts
// plugins/tanstack-fetch.ts
import { createFetch } from 'tanstack-fetch/sse'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const api = createFetch({
    baseUrl: useRuntimeConfig().public.apiBase,
    plugins: ['sse-resume', 'ssr-forward'],
    getToken: () => useCookie('access_token').value,
  })

  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
  return { provide: { api } }
})
```

Full cookie / hydrate walkthrough: [SSR — Nuxt](/guide/ssr#nuxt) · [Nuxt SSR example](/examples/nuxt-ssr)

Then in a page or component:

```vue
<script setup lang="ts">
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'

const api = useFetchClient()
// or: const { $api } = useNuxtApp()
</script>
```

## `useSse`

Create the client from **`tanstack-fetch/sse`**, then pass `{ client: api }`. **Plugin is not required.**

`status`: `'connecting' | 'connected' | 'disconnected' | 'error'`

Refs unwrap in the template.

```vue
<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

type OrderEvent = { id: string; status: string }

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
  client: api,
})
</script>

<template>
  <p v-if="status === 'error'">{{ error?.message }}</p>
  <div v-else>
    <p>{{ status }}</p>
    <p>{{ data ? `${data.id} · ${data.status}` : 'waiting…' }}</p>
    <button type="button" :disabled="status === 'disconnected'" @click="close">Disconnect</button>
  </div>
</template>
```

### Optional: via plugin

If the app already has `createFetchPlugin({ client: api })` with an SSE client, omit `client` and `useSse` reads it from inject.

## `provideFetchClient`

Call in a **parent** `setup()` so child components can `useFetch()` (same-component `provide` + `inject` does not work in Vue):

```ts
import { provideFetchClient } from 'tanstack-fetch/vue'

// parent setup()
provideFetchClient(api)
```

Prefer `createFetchPlugin` for app-wide / Nuxt setup.

## TanStack Vue Query

```ts
import { useQuery } from '@tanstack/vue-query'
import { useFetch } from 'tanstack-fetch/vue'

const api = useFetch()

const { data, error, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

API reference: [Vue API](/api/vue) · [SSE](/guide/sse) · [React twin](/guide/react)
