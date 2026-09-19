# tRPC

![tRPC httpBatchLink powered by createFetch](/images/docs-trpc.png)

Same `createFetch` auth / plugins — wired into tRPC for **React**, **TanStack Router**, and **TanStack Start**.

```bash
npm install tanstack-fetch @trpc/client @trpc/tanstack-react-query @tanstack/react-query
```

```ts
import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { QueryClient } from '@tanstack/react-query'
import type { AppRouter } from './server'

const api = createFetch({
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => localStorage.removeItem('access_token'),
})

const queryClient = new QueryClient()
const trpcClient = createTRPCFetchClient<AppRouter>({
  url: '/api/trpc',
  client: api,
})
const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient })

useQuery(trpc.post.list.queryOptions())
```

## Helpers

| Helper                                 | Role                        |
| -------------------------------------- | --------------------------- |
| `createTRPCFetch(api)`                 | `fetch` for `httpBatchLink` |
| `createTRPCFetchLink({ url, client })` | ready terminating link      |
| `createTRPCFetchClient<AppRouter>(…)`  | full client                 |

Relative URLs like `/api/trpc` work for Router / Start. Full SSR notes: [tRPC recipe](/recipes/trpc).

Example: [`examples/trpc`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc)
