---
layout: home
title: tanstack-fetch by Mohammad Garmabi
titleTemplate: Typed Fetch for TanStack Query
description: tanstack-fetch by Mohammad Garmabi — typed Fetch client designed for TanStack Query. Tiny HTTP core, SSR, SSE, upload, tRPC. Lightweight axios alternative for React Query.

hero:
  name: tanstack-fetch
  text: Typed Fetch for TanStack Query
  tagline: By Mohammad Garmabi · Tiny HTTP core · typed errors · AbortSignal · SSR · SSE · tRPC — built for the queryFn mental model.
  image:
    src: /images/logo.jpg
    alt: tanstack-fetch fox logo by Mohammad Garmabi
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Live playground
      link: /examples/playground
    - theme: alt
      text: View on GitHub
      link: https://github.com/mohamadgarmabi/tanstack-fetch
    - theme: alt
      text: Author
      link: /author

features:
  - title: Query-native
    details: Returns data, throws FetchError, honors signal — drop straight into useQuery / queryOptions.
  - title: ~3.5KB core
    details: Tree-shakeable entries for HTTP, SSE, React, plugins, and tRPC. No axios-sized stack.
  - title: Auth & every 4xx
    details: getToken plus 401–429 shortcuts (and onClientError / 4xx), including rate-limit Retry-After.
  - title: SSR · SSE · Upload · tRPC
    details: Cookie forwarding, fetch-based streams, multipart progress, and createTRPCFetchClient.
---

<HomeIntro />

<NpmDownloadBadges package-name="tanstack-fetch" />

<HomePackagesLink />

## Try it live

Click real status codes — this runs **`createFetch` in your browser** with a mock `fetch` (not a screenshot).

<StatusPlayground />

More live demos: [React](/examples/react) · [Next.js SSR](/examples/next-ssr) · [Upload](/examples/upload) · [SSE](/examples/sse) · [all playgrounds](/examples/playground)

## Visual overview

|                                                |                                                    |
| ---------------------------------------------- | -------------------------------------------------- |
| ![Mental model](/images/docs-mental-model.png) | ![TanStack Query](/images/docs-tanstack-query.png) |
| ![Auth & status](/images/docs-auth-status.png) | ![tRPC](/images/docs-trpc.png)                     |
| ![SSR](/images/docs-ssr-forward.png)           | ![SSE](/images/docs-sse.png)                       |

```ts
import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```
