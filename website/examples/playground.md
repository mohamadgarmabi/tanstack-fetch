---
title: Live playground
description: Run real createFetch demos — status handlers, React Query, Next.js SSR, upload, and SSE. Filter by framework in the header.
---

# Live playground

All widgets import **`tanstack-fetch` from source** and use a mock `fetch` / stream. Use the **Framework** picker to show only your stack.

:::: framework core

## Open in StackBlitz

| Example        | Framework           | StackBlitz                                                                                            | Docs                              |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------- |
| TanStack Query | **React**           | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/tanstack-query) | [React](/examples/react)          |
| Next.js SSR    | **React** · Next.js | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)       | [Next SSR](/examples/next-ssr)    |
| Nuxt SSR       | **Vue** · Nuxt      | —                                                                                                     | [Nuxt SSR](/examples/nuxt-ssr)    |
| Upload         | **Core** demo       | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)    | [Upload](/examples/upload)        |
| SSE            | **React** / adapters | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)       | [SSE](/examples/sse)              |
| tRPC           | **React** / Start   | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/trpc)           | [tRPC recipe](/recipes/trpc)      |
| Auth status    | **Core**            | [Open](https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples/auth-status)    | [Refresh](/recipes/refresh-token) |

## Status matrix (incl. 429)

::: tip Framework
**Core**
:::

<StatusPlayground />

## Upload

::: tip Framework
**Core**
:::

<UploadDemo />

## queryFn shape

<LiveQueryDemo />

::::

:::: framework react

## React / TanStack Query

::: tip Framework
**React**
:::

<ReactQueryDemo />

## SSE · React `useSse`

::: tip Framework
**React** · `tanstack-fetch/react`
:::

<UseSseDemo />

::::

:::: framework nextjs

## Next.js SSR

::: tip Framework
**React** · Next.js
:::

<NextSsrDemo />

::::

:::: framework vue

## Nuxt / Vue

::: tip Framework
**Vue** · Nuxt
:::

Live Nuxt SSR walkthrough: [Nuxt SSR example](/examples/nuxt-ssr) · [Vue guide](/guide/vue).

::::

:::: framework solid

## Solid

::: tip Framework
**Solid** · `tanstack-fetch/solid`
:::

Browser demos for Solid live in the [Solid guide](/guide/solid) and [SSE · Solid](/guide/sse#solid). StackBlitz apps are React today — copy the Solid snippets from those pages.

::::

:::: framework angular

## Angular

::: tip Framework
**Angular** · `tanstack-fetch/angular`
:::

See [Angular guide](/guide/angular) and [SSE · Angular](/guide/sse#angular).

::::

:::: framework svelte

## Svelte / SvelteKit

::: tip Framework
**Svelte** · `tanstack-fetch/svelte`
:::

See [Svelte guide](/guide/svelte) and [SSE · Svelte](/guide/sse#svelte--sveltekit).

::::

:::: framework tanstack-start

## TanStack Start

::: tip Framework
**TanStack Start** · Query + Router context
:::

Start + Query patterns: [TanStack Query](/guide/tanstack-query) · [tRPC recipe](/recipes/trpc).

::::

:::: framework remix

## Remix

::: tip Framework
**Remix**
:::

Loader + Query patterns: [tRPC · Remix](/recipes/trpc#4-remix--tanstack-query).

::::

:::: framework solid-start

## SolidStart

::: tip Framework
**SolidStart**
:::

See [Solid guide](/guide/solid) and [tRPC · SolidStart](/recipes/trpc#3-solidstart--tanstack-query).

::::

:::: framework core

## SSE core stream

::: tip Framework
**Core** · `api.sse`
:::

<SseDemo />

::::
