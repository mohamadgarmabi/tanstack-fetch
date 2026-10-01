---
title: Examples
description: Live createFetch demos for React, Vue, Next.js, Nuxt, upload, SSE, and status handlers.
---

# Examples

## Live in the docs

These widgets run **`createFetch` in your browser** (mock `fetch` / streams) — not screenshots.

| Demo                                 | Framework                  | What it runs                 |
| ------------------------------------ | -------------------------- | ---------------------------- |
| [Status / 4xx](/examples/playground) | Core                       | Handlers incl. **429**       |
| [React Query](/examples/react)       | **React**                  | `queryFn` + `mutationFn`     |
| [Next.js SSR](/examples/next-ssr)    | **React** · Next.js        | `ssr-forward` cookies        |
| [Nuxt SSR](/examples/nuxt-ssr)       | **Vue** · Nuxt             | `ssr-forward` + Vue plugin   |
| [Upload](/examples/upload)           | Core                       | `api.upload` multipart       |
| [SSE](/examples/sse)                 | Core + **React** / **Vue** | `api.sse` + `useSse`         |
| [DevTools](/examples/devtools)       | Core                       | HTTP / SSE / SSR / tRPC dock |

### React

::: tip Framework
**React** · TanStack Query
:::

<ReactQueryDemo />

### Next.js SSR

::: tip Framework
**React** · Next.js App Router
:::

<NextSsrDemo />

### Core — upload & SSE

::: tip Framework
**Core** (framework-agnostic) · SSE React demo below
:::

<UploadDemo />

<SseDemo />

<UseSseDemo />

## Copy-paste apps

Clone the repo and open a folder under [`examples/`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples):

| App                                                                                                  | Framework           | Focus                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------- |
| [basic-http](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/basic-http)         | Core                | Plain `get` / `post` / errors         |
| [tanstack-query](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query) | **React**           | `useQuery` + `useMutation`            |
| [auth-status](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/auth-status)       | **React**           | Token + **4xx** (incl. **429**) / 5xx |
| [file-upload](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)       | **React**           | Upload + progress                     |
| [sse-live](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)             | **React**           | `useSse` live stream                  |
| [next-ssr](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)             | **React** · Next.js | App Router + `ssr-forward`            |
| [trpc](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc)                     | **React**           | tRPC + `createTRPCFetchClient`        |

Nuxt SSR walkthrough (docs): [Nuxt SSR](/examples/nuxt-ssr)
