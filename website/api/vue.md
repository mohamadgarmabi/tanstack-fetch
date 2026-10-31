---
title: Vue API
description: Vue and Nuxt API reference for tanstack-fetch — createFetchPlugin, useFetch, useSse, useWs, and injection key.
---

# Vue API

![Vue API](/images/page-api-vue.jpg)

```ts
import {
  createFetchPlugin,
  provideFetchClient,
  useFetch,
  useSse,
  useWs,
  fetchClientKey,
} from 'tanstack-fetch/vue'
```

| Export                    | Role                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `createFetchPlugin(opts)` | `app.use(...)` / Nuxt plugin — provides the client                 |
| `provideFetchClient(api)` | `provide` in a **parent** setup for child `useFetch`               |
| `useFetch()`              | Inject the shared client                                           |
| `useSse(path, options)`   | Vue SSE helper (needs SSE client)                                  |
| `useWs(path, options)`    | WebSocket / WebTransport composable (`tanstack-fetch/live` client) |
| `fetchClientKey`          | Injection key (advanced)                                           |

Nuxt already ships a core `useFetch`. Rename on import when needed:

```ts
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'
```

### `useSse` result

| Field    | Type                                                            |
| -------- | --------------------------------------------------------------- |
| `data`   | `Ref` — last message payload                                    |
| `event`  | `Ref` — last full SSE event                                     |
| `error`  | `Ref` — last error                                              |
| `status` | `Ref<'connecting' \| 'connected' \| 'disconnected' \| 'error'>` |
| `close`  | Stop the stream                                                 |

### `useSse` options

| Option    | Role                                                             |
| --------- | ---------------------------------------------------------------- |
| `client`  | SSE client from `tanstack-fetch/sse` (**preferred** — no plugin) |
| `enabled` | When `false`, stays `disconnected`                               |

### Example (no plugin)

```vue
<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const { data, status, error, close } = useSse<{ id: string }>('/orders/stream', {
  client: api,
})
</script>

<template>
  <p v-if="status === 'connecting'">Connecting…</p>
  <p v-else-if="status === 'error'">{{ error?.message }}</p>
  <div v-else>
    <p>{{ status }}</p>
    <pre>{{ data }}</pre>
    <button type="button" @click="close">Disconnect</button>
  </div>
</template>
```

### `useWs` result

| Field    | Type                                                               |
| -------- | ------------------------------------------------------------------ |
| `data`   | `Ref` — last message (JSON parsed)                                 |
| `error`  | `Ref` — last error                                                 |
| `status` | `Ref` — `'connecting' \| 'connected' \| 'disconnected' \| 'error'` |
| `send`   | Send a message (queued until open, JSON for objects)               |
| `close`  | Close and stop reconnecting                                        |

### `useWs` options

All [`api.ws` options](/guide/websocket#options) (`authIn`, `reconnect`, `protocols`, `transport`, `params`, `query`, …), plus:

| Option    | Role                                              |
| --------- | ------------------------------------------------- |
| `client`  | Client from `tanstack-fetch/live` (**preferred**) |
| `enabled` | When `false`, stays `disconnected`                |

Guide: [Vue & Nuxt](/guide/vue) · [SSE](/guide/sse) · [WebSocket](/guide/websocket)
