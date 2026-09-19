# tanstack-fetch + tRPC

Minimal copy-paste example: shared `createFetch` client, `createTRPCFetchClient`, and TanStack Query via `@trpc/tanstack-react-query`.

Works the same way in **React**, **TanStack Router**, and **TanStack Start** — only the URL / provider wiring changes.

Source files under [`src/`](./src):

- [`src/lib/api.ts`](./src/lib/api.ts) — `createFetch` (auth + plugins)
- [`src/lib/trpc.ts`](./src/lib/trpc.ts) — `createTRPCFetchClient` + `createTRPCOptionsProxy`
- [`src/server/app-router.ts`](./src/server/app-router.ts) — sample `AppRouter` type source
- [`src/posts.hook.ts`](./src/posts.hook.ts) — `useQuery` / `useMutation`
- [`src/App.tsx`](./src/App.tsx) — UI only
- [`src/main.tsx`](./src/main.tsx) — `QueryClientProvider`

## Install

```bash
npm install tanstack-fetch @trpc/client @trpc/server @trpc/tanstack-react-query @tanstack/react-query react react-dom
```

## Files

### `src/lib/api.ts`

```ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
  },
  plugins: ['trace', 'retry-idempotent'],
})
```

### `src/lib/trpc.ts`

```ts
import { QueryClient } from '@tanstack/react-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { api } from './api'
import type { AppRouter } from '../server/app-router'

export const queryClient = new QueryClient()

export const trpcClient = createTRPCFetchClient<AppRouter>({
  url: import.meta.env.VITE_TRPC_URL ?? '/api/trpc',
  client: api,
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
```

### `src/posts.hook.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trpc } from './lib/trpc'

export const usePosts = () => {
  const queryClient = useQueryClient()
  const listQuery = useQuery(trpc.post.list.queryOptions())

  const createPost = useMutation({
    ...trpc.post.create.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.post.list.queryFilter())
    },
  })

  return {
    posts: listQuery.data ?? [],
    statusMessage: listQuery.isPending
      ? 'Loading…'
      : listQuery.isError
        ? listQuery.error.message
        : '',
    isCreatePending: createPost.isPending,
    handleCreate: () => createPost.mutate({ title: 'New post from tanstack-fetch' }),
  }
}
```

### Provider

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { queryClient } from './lib/trpc'

createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
)
```

## TanStack Router / Start

See [`docs/recipes/trpc.md`](../../docs/recipes/trpc.md) for router context, loaders, and SSR URL helpers.

## Why this shape?

- One `createFetch` client for REST **and** tRPC (token, 401, plugins)
- `createTRPCFetchClient` plugs that client into tRPC links
- `createTRPCOptionsProxy` gives TanStack Query `queryOptions` / `mutationOptions`

Replace [`src/server/app-router.ts`](./src/server/app-router.ts) with `import type { AppRouter } from '../your-server/router'`.
