---
title: Live playground
description: Run real createFetch demos — status handlers, React Query, Next.js SSR, upload, and SSE.
---

# Live playground

All widgets import **`tanstack-fetch` from source** and use a mock `fetch` / stream. Not screenshots.

## Open in StackBlitz

| Example        | Framework           | StackBlitz                                                                                            | Docs                              |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------- |
| TanStack Query | **React**           | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query) | [React](/examples/react)          |
| Next.js SSR    | **React** · Next.js | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)       | [Next SSR](/examples/next-ssr)    |
| Nuxt SSR       | **Vue** · Nuxt      | —                                                                                                     | [Nuxt SSR](/examples/nuxt-ssr)    |
| Upload         | **React** demo app  | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)    | [Upload](/examples/upload)        |
| SSE            | **React** demo app  | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)       | [SSE](/examples/sse)              |
| tRPC           | **React**           | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc)           | [tRPC recipe](/recipes/trpc)      |
| Auth status    | **React**           | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/auth-status)    | [Refresh](/recipes/refresh-token) |

## Status matrix (incl. 429)

::: tip Framework
**Core**
:::

<StatusPlayground />

## React / TanStack Query

::: tip Framework
**React**
:::

<ReactQueryDemo />

## Next.js SSR

::: tip Framework
**React** · Next.js
:::

<NextSsrDemo />

## Upload

::: tip Framework
**Core**
:::

<UploadDemo />

## SSE

::: tip Framework
**Core** + **React** live `useSse`
:::

<SseDemo />

<UseSseDemo />

## queryFn shape

<LiveQueryDemo />
