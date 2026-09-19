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
    src: /images/docs-og-banner.png
    alt: tanstack-fetch by Mohammad Garmabi — Typed Fetch for TanStack Query
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

<p align="center">
  <img class="hero-gif" src="/images/tanstack-fetch-hero.gif" alt="tanstack-fetch by Mohammad Garmabi — createFetch + TanStack Query demo" width="720" height="456" />
</p>

<p align="center">
  Created by <strong><a href="/author">Mohammad Garmabi</a></strong> ·
  <a href="https://www.npmjs.com/package/tanstack-fetch">npm</a> ·
  <a href="https://github.com/mohamadgarmabi/tanstack-fetch">GitHub</a>
</p>

```ts
import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```
