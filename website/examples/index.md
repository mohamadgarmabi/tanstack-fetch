---
title: Examples
description: Live createFetch demos for React, Next.js, upload, SSE, and status handlers.
---

# Examples

## Live in the docs

These widgets run **`createFetch` in your browser** (mock `fetch` / streams) — not screenshots.

| Demo                                 | What it runs                |
| ------------------------------------ | --------------------------- |
| [Status / 4xx](/examples/playground) | Handlers incl. **429**      |
| [React Query](/examples/react)       | `queryFn` + `mutationFn`    |
| [Next.js SSR](/examples/next-ssr)    | `ssr-forward` cookies       |
| [Upload](/examples/upload)           | `api.upload` multipart      |
| [SSE](/examples/sse)                 | `tanstack-fetch/sse` stream |

<ReactQueryDemo />

<NextSsrDemo />

<UploadDemo />

<SseDemo />

## Copy-paste apps

Clone the repo and open a folder under [`examples/`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples):

| App                                                                                                  | Focus                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [basic-http](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/basic-http)         | Plain `get` / `post` / errors         |
| [tanstack-query](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query) | `useQuery` + `useMutation`            |
| [auth-status](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/auth-status)       | Token + **4xx** (incl. **429**) / 5xx |
| [file-upload](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)       | Upload + progress                     |
| [sse-live](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)             | `useSse` live stream                  |
| [next-ssr](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)             | App Router + `ssr-forward`            |
| [trpc](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc)                     | tRPC + `createTRPCFetchClient`        |
