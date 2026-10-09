---
title: Comparison
description: Compare tanstack-fetch with axios, ky, and ofetch for TanStack Query, SSR cookies, SSE with Authorization, upload progress, and tRPC.
---

# Comparison

![tanstack-fetch vs axios, ky, and ofetch](/images/docs-comparison.jpg)

Use the **Framework** picker — the matrix below is **core**; stack-specific notes appear under each framework.

:::: framework core

tanstack-fetch is an HTTP client shaped for TanStack Query. axios, ky, and ofetch can do the same network work — the difference is the call site.

## Feature matrix

| Need                               | tanstack-fetch                                    | axios   | ky      | ofetch  |
| ---------------------------------- | ------------------------------------------------- | ------- | ------- | ------- |
| Drop into TanStack Query `queryFn` | Returns data, throws `FetchError`, takes `signal` | Adapt   | Adapt   | Adapt   |
| Typed error with status / body     | `FetchError` + `isFetchError`                     | Partial | Partial | Partial |
| Handlers for 401–429               | First-class                                       | Custom  | Custom  | Custom  |
| Refresh token + single-flight      | Interceptor + `{ action: 'retry' }`               | Custom  | Custom  | Custom  |
| Next.js SSR cookies                | `ssr-forward` plugin                              | Custom  | Custom  | Custom  |
| SSE with Authorization             | `tanstack-fetch/sse`                              | No      | No      | No      |
| File upload + progress             | `api.upload()`                                    | Yes     | Limited | Limited |
| tRPC transport                     | `tanstack-fetch/trpc`                             | No      | No      | No      |
| Bundle                             | **4.81KB** gzip HTTP core                         | Larger  | Small   | Small   |

## Before / after

### axios into Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: async ({ signal }) => {
    const response = await axios.get('/users', { signal })
    return response.data
  },
})
```

### tanstack-fetch into Query

```ts
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

No `.data` unwrap. HTTP failures throw, so Query’s `isError` path stays honest.

**Migrating?** CLI + mapping for axios, ky, ofetch, and raw fetch: [Migrate](/guide/migrate).

## Refresh token

```ts
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{
        accessToken: string
        expiresIn: number
      }>('/auth/refresh', {
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      /* persist body.accessToken + expiresAt */
    },
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000,
    },
    after: { enabled: true },
  }),
)
```

Full recipe: [Refresh token](/recipes/refresh-token).

## When to keep axios

- You already have a large axios interceptor stack and no Query migration planned
- You need axios-specific adapters that are not fetch-based

Otherwise, if TanStack Query is the source of truth for loading and errors, tanstack-fetch matches that model with less glue.

::::

:::: framework react

## React / Query

Use `@tanstack/react-query` + `tanstack-fetch/react`. Guide: [React](/guide/react) · [TanStack Query](/guide/tanstack-query).

::::

:::: framework vue

## Vue / Nuxt

Use `@tanstack/vue-query` + `tanstack-fetch/vue`. Guide: [Vue](/guide/vue).

::::

:::: framework solid

## Solid

Use `@tanstack/solid-query` + `tanstack-fetch/solid`. Guide: [Solid](/guide/solid).

::::

:::: framework angular

## Angular

Use `@tanstack/angular-query-experimental` + `tanstack-fetch/angular`. Guide: [Angular](/guide/angular).

::::

:::: framework svelte

## Svelte

Use `@tanstack/svelte-query` + `tanstack-fetch/svelte`. Guide: [Svelte](/guide/svelte).

::::

:::: framework nextjs

## Next.js

SSR cookies via `ssr-forward`. Guide: [SSR · Next.js](/guide/ssr#nextjs).

::::

:::: framework tanstack-start

## TanStack Start

Router context + Query. [TanStack Query](/guide/tanstack-query) · [tRPC recipe](/recipes/trpc).

::::

:::: framework remix

## Remix

Loaders + optional Query hydration. [tRPC · Remix](/recipes/trpc#4-remix--tanstack-query).

::::
