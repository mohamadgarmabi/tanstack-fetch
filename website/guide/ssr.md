# SSR & Next.js

![SSR cookie forwarding with ssr-forward](/images/docs-ssr-forward.png)

## Live demo

<NextSsrDemo />

Use absolute `baseUrl` on the server and the `ssr-forward` plugin to forward cookies / auth headers.

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

## Prefetch + hydrate

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { usersQueryOptions } from '@/queries/users'

export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(usersQueryOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient />
    </HydrationBoundary>
  )
}
```

Example: [`examples/next-ssr`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)
