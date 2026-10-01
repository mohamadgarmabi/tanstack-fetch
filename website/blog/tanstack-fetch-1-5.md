---
title: 'tanstack-fetch 1.5.0: Vue and Nuxt'
description: createFetchPlugin, useFetch, and useSse for Vue 3 and Nuxt — same client as React.
---

# tanstack-fetch 1.5.0: Vue and Nuxt

<p class="blog-meta">October 1, 2026</p>

`tanstack-fetch/vue` mirrors the React helpers for Vue 3 and Nuxt.

## What you get

| Export               | Role                                     |
| -------------------- | ---------------------------------------- |
| `createFetchPlugin`  | `app.use` / Nuxt plugin                  |
| `provideFetchClient` | `provide` in a composition scope         |
| `useFetch`           | Inject the shared client                 |
| `useSse`             | SSE composable (returns refs + `status`) |

Prefer passing the SSE client directly:

```vue
<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

const api = createFetch({ plugins: ['sse-resume'] })

const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
  client: api,
})
</script>
```

## Nuxt

```ts
// plugins/tanstack-fetch.ts
import { createFetch } from 'tanstack-fetch/sse'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const api = createFetch({
    baseUrl: useRuntimeConfig().public.apiBase,
    plugins: ['sse-resume'],
  })
  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
})
```

Nuxt’s own `useFetch` keeps its name — import ours as `useFetchClient` when needed.

## Docs

- [Vue & Nuxt guide](/guide/vue)
- [Vue API](/api/vue)
- [SSE](/guide/sse#vue-usesse)
