---
title: SSR
description: Forward cookies and auth headers with ssr-forward in Next.js and Nuxt — same createFetch client on server and browser.
---

# SSR

![SSR cookie forwarding with ssr-forward](/images/docs-ssr-forward.png)

    10|Forward cookies and auth headers from the incoming server request. Same `createFetch` client in the browser — `ssr-forward` skips on the client.

## Live demo

::: tip Framework
**Next.js** (App Router) · simulated server `incoming` in the browser
:::

<NextSsrDemo />

    20|---

## Next.js

::: tip Framework
**React** · Next.js App Router · `@tanstack/react-query`
:::

Use absolute `baseUrl` on the server and the `ssr-forward` plugin.

    30|```ts

import { createFetch } from 'tanstack-fetch'
import {
createRetryIdempotentInterceptor,
createSsrForwardInterceptor,
createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { cookies } from 'next/headers'

export const api = createFetch({
baseUrl: process.env.API_URL, // absolute in SSR
source: 'ssr',
interceptors: [
createSsrForwardInterceptor(),
createTraceInterceptor(),
createRetryIdempotentInterceptor(),
],
incoming: async () => {
const jar = await cookies()
40| return { cookie: jar.toString() }
},
})

````

### Prefetch + hydrate

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { usersQueryOptions } from '@/queries/users'
    50|
export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.query(usersQueryOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient />
    </HydrationBoundary>
  )
}
    60|```

Example: [Next.js SSR](/examples/next-ssr) · repo: [`examples/next-ssr`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr) · Blog: [Next.js fetch vs tanstack-fetch](/blog/nextjs-fetch-tanstack-fetch)

## Why cookies don't forward by default

Next.js App Router `fetch()` runs in a server context with a clean request — browser cookies are not piped automatically. Without `ssr-forward`, your server `queryFn` sees no auth and returns 401 or empty data, even though the browser has the cookie.

This is the most common SSR failure for TanStack Query + Next.js apps.

---

## Next.js
````
