---
title: Svelte & SvelteKit
description: Svelte helpers for tanstack-fetch — setFetchClient, useFetch, and useSse stores with TanStack Svelte Query.
---

# Svelte & SvelteKit

![Svelte & SvelteKit](/images/page-guide-svelte.jpg)

::: tip Framework
**Svelte / SvelteKit** · `tanstack-fetch/svelte` · `@tanstack/svelte-query`
:::

Optional helpers from `tanstack-fetch/svelte`. Call `setFetchClient` in a parent layout; `useSse` returns Svelte stores.

## Install

```bash
npm install tanstack-fetch svelte
# optional Query
npm install @tanstack/svelte-query
```

`svelte` is an optional peer (`>=4`).

## `setFetchClient` + `useFetch`

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { createFetch } from 'tanstack-fetch'
  import { createAuthInterceptor } from 'tanstack-fetch/plugins'
  import { setFetchClient } from 'tanstack-fetch/svelte'

  const api = createFetch({
    baseUrl: import.meta.env.VITE_API_URL,
    interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') })],
  })
  setFetchClient({ client: api })
</script>

<slot />
```

```svelte
<script lang="ts">
  import { useFetch } from 'tanstack-fetch/svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { isFetchError } from 'tanstack-fetch'

  const api = useFetch()
  const users = createQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })
</script>

{#if $users.isPending}
  <p>Loading…</p>
{:else if $users.isError}
  <p>{isFetchError($users.error) ? $users.error.status : 'Error'}</p>
{:else}
  <ul>
    {#each $users.data ?? [] as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{/if}
```

## `useSse`

Stores: `$data`, `$status`, `$error`. Prefer `{ client }` from `tanstack-fetch/sse`. Keep streams in **browser** components (not `+page.server.ts`).

```svelte
<script lang="ts">
  import { createFetch } from 'tanstack-fetch/sse'
  import { useSse } from 'tanstack-fetch/svelte'

  const api = createFetch({ plugins: ['sse-resume'] })
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', {
    client: api,
  })
</script>

{#if $status === 'error'}
  <p>{$error?.message}</p>
{:else}
  <p>{$status}</p>
  <pre>{JSON.stringify($data, null, 2)}</pre>
  <button type="button" on:click={close}>Stop</button>
{/if}
```

## `useWs`

Create the client from **`tanstack-fetch/live`** and pass `{ client: api }`. Same result shape as `useSse`, plus `send`. In the browser, set `authIn` (`'query'` or `'protocol'`) when you have a token. Add `transport: 'webtransport'` for WebTransport. See [WebSocket, WebTransport & streams](./websocket).

```svelte
<script lang="ts">
  import { createFetch } from 'tanstack-fetch/live'
  import { useWs } from 'tanstack-fetch/svelte'

  const api = createFetch({ getToken: () => localStorage.getItem('access_token') })
  const { data, status, send } = useWs<ChatMessage>('/rooms/lobby', {
    client: api,
    authIn: 'query',
  })
</script>

<p>{$status}</p>
<p>{$data?.text ?? 'waiting…'}</p>
<button type="button" on:click={() => send({ text: 'hi' })}>Send</button>
```

## SvelteKit SSR

Use `src/lib/api.server.ts` from the migrate scaffold (`ssr-forward` + cookies) for load functions. Browser code stays on `setFetchClient` / `$lib/api.ts`.

```bash
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
```

## Related

- [Blog · Svelte / SvelteKit fetch vs tanstack-fetch](/blog/sveltekit-fetch-tanstack-fetch)
- [SSE · Svelte](/guide/sse#svelte--sveltekit)
- [tRPC · Svelte](/guide/trpc#svelte--sveltekit)
- [Migrate](/guide/migrate)
