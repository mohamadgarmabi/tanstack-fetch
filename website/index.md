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
      text: View on GitHub
      link: https://github.com/mohamadgarmabi/tanstack-fetch
    - theme: alt
      text: Author
      link: /author
    - theme: alt
      text: npm downloads
      link: /packages

features:
  - title: Query-native
    details: Returns data, throws FetchError, honors signal — drop straight into useQuery / queryOptions.
  - title: ~3.5KB core
    details: Tree-shakeable entries for HTTP, SSE, React, plugins, and tRPC. No axios-sized stack.
  - title: Auth & status
    details: getToken, onUnauthorized / 403 / 404 / 5xx, plus named plugins and interceptors.
  - title: SSR · SSE · Upload · tRPC
    details: Cookie forwarding, fetch-based streams, multipart progress, and createTRPCFetchClient.
---

<HomeIntro />

<NpmDownloadBadges package-name="tanstack-fetch" />

<HomePackagesLink />

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
