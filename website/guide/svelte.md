---
title: Svelte & SvelteKit
description: Svelte helpers for tanstack-fetch — setFetchClient, useFetch, and useSse stores with TanStack Svelte Query.
---

# Svelte & SvelteKit

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
  import { setFetchClient } from 'tanstack-fetch/svelte'

  const api = createFetch({
    baseUrl: import.meta.env.VITE_API_URL,
    getToken: () => localStorage.getItem('access_token'),
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

## SvelteKit SSR

Use `src/lib/api.server.ts` from the migrate scaffold (`ssr-forward` + cookies) for load functions. Browser code stays on `setFetchClient` / `$lib/api.ts`.

```bash
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
```

## Related

- [SSE · Svelte](/guide/sse#svelte--sveltekit)
- [tRPC · Svelte](/guide/trpc#svelte--sveltekit)
- [Migrate](/guide/migrate)
