---
title: Examples
description: Live createFetch demos for React, Vue, Next.js, Nuxt, Solid, Angular, Svelte, upload, SSE, WebSocket, WebTransport, NDJSON, tRPC, and status handlers.
---

# Examples

![Examples](/images/page-examples-index.jpg)

> **Looking for a specific feature?** The [Cookbook](/examples/cookbook) has a copy-paste example for every one: HTTP, errors, refresh token, interceptors, upload, SSR, SSE, WebSocket, WebTransport, NDJSON, hooks, tRPC, DevTools and the CLI.

## Live in the docs

These widgets run **`createFetch` in your browser** (mock `fetch` / streams) — not screenshots.

| Demo                                      | Framework                  | What it runs                                         |
| ----------------------------------------- | -------------------------- | ---------------------------------------------------- |
| [Status / 4xx](/examples/playground)      | Core                       | Handlers incl. **429**                               |
| [React Query](/examples/react)            | **React**                  | `queryFn` + `mutationFn`                             |
| [Next.js SSR](/examples/next-ssr)         | **React** · Next.js        | `ssr-forward` cookies                                |
| [Nuxt SSR](/examples/nuxt-ssr)            | **Vue** · Nuxt             | `ssr-forward` + Vue plugin                           |
| [Upload](/examples/upload)                | Core                       | `api.upload` multipart                               |
| [SSE](/examples/sse)                      | Core + **all frameworks**  | `api.sse` · React/Vue `useSse` · [guide](/guide/sse) |
| [WebSocket & streams](/examples/realtime) | Core + **all frameworks**  | `api.ws` · `api.transport` · `api.stream` · `useWs`  |
| [tRPC](/guide/trpc)                       | **React** StackBlitz + all | `createTRPCFetchClient` · [recipe](/recipes/trpc)    |
| [DevTools](/examples/devtools)            | Core                       | HTTP / SSE / SSR / tRPC / WS / Stream dock           |

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

### Core — WebSocket · WebTransport · NDJSON

<RealtimeDemo kind="ws" />

<RealtimeDemo kind="stream" />

More: [all realtime demos](/examples/realtime) · [cookbook](/examples/cookbook)

## Copy-paste apps

Clone the repo and open a folder under [`examples/`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples):

| App                                                                                                  | Framework           | Focus                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------- |
| [basic-http](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/basic-http)         | Core                | Plain `get` / `post` / errors         |
| [tanstack-query](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query) | **React**           | `useQuery` + `useMutation`            |
| [auth-status](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/auth-status)       | **React**           | Token + **4xx** (incl. **429**) / 5xx |
| [file-upload](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)       | **React**           | Upload + progress                     |
| [sse-live](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)             | **React**           | `useSse` live stream                  |
| [ws-chat](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/ws-chat)               | **React**           | `useWs` chat + NDJSON answer          |
| [next-ssr](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)             | **React** · Next.js | App Router + `ssr-forward`            |
| [trpc](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc)                     | **React**           | tRPC + `createTRPCFetchClient`        |

Nuxt SSR walkthrough (docs): [Nuxt SSR](/examples/nuxt-ssr)
