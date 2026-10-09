---
title: What is tanstack-fetch?
description: tanstack-fetch is a typed Fetch client shaped for TanStack Query — return data, throw FetchError, honor AbortSignal. Filter by framework in the header.
---

# What is tanstack-fetch?

**tanstack-fetch** (by [Mohammad Garmabi](/author)) is a tiny, typed Fetch client shaped for [@tanstack/query](https://tanstack.com/query).

It is **not** an official TanStack package — it matches the same mental model Query expects from a `queryFn`.

Use the **Framework** picker to show only your stack.

:::: framework core

## Mental model

1. **Return data** on success
2. **Throw** on HTTP failure (`FetchError`)
3. **Honor `AbortSignal`** so cancel / unmount is clean

![Mental model](/images/docs-mental-model.png)

## Core entry points

| Import                   | What you get                         | gzip       |
| ------------------------ | ------------------------------------ | ---------- |
| `tanstack-fetch`         | HTTP (`get` / `post` / `upload` / …) | **4.81KB** |
| `tanstack-fetch/sse`     | + `api.sse()`                        | **5.94KB** |
| `tanstack-fetch/plugins` | plugin factories                     | **1.13KB** |
| `tanstack-fetch/trpc`    | tRPC link via `createFetch`          | **3.16KB** |
| `tanstack-fetch/devtools`| request dock                         | **8.32KB** |

```ts
import { createFetch } from 'tanstack-fetch' // HTTP only
import { createFetch } from 'tanstack-fetch/sse' // + streams
```

## Next (core)

- [Getting started](./getting-started)
- [Configuration](./configuration)
- [createFetch API](/api/create-fetch)
- [Agent skill](./skill)

::::

:::: framework react

## React

::: tip Framework
**React** · `tanstack-fetch/react`
:::

| Import                 | What you get              | gzip       |
| ---------------------- | ------------------------- | ---------- |
| `tanstack-fetch/react` | `FetchProvider` / `useFetch` / `useSse` | **0.81KB** |

- [React guide](./react)
- [TanStack Query](./tanstack-query)
- [Playground · React](/examples/playground)

::::

:::: framework nextjs

## Next.js

::: tip Framework
**Next.js** · React + `ssr-forward`
:::

- [SSR · Next.js](./ssr#nextjs)
- [Playground · Next SSR](/examples/playground)

::::

:::: framework tanstack-start

## TanStack Start

::: tip Framework
**TanStack Start** · Query + Router context
:::

- [TanStack Query · Start](./tanstack-query)
- [tRPC · Start](/recipes/trpc)

::::

:::: framework remix

## Remix

::: tip Framework
**Remix**
:::

- [tRPC · Remix](/recipes/trpc#4-remix--tanstack-query)
- [SSR cookies](./ssr)

::::

:::: framework vue

## Vue / Nuxt

::: tip Framework
**Vue 3 / Nuxt** · `tanstack-fetch/vue`
:::

| Import               | What you get                         | gzip       |
| -------------------- | ------------------------------------ | ---------- |
| `tanstack-fetch/vue` | plugin / composables (Vue 3 / Nuxt)  | **0.78KB** |

- [Vue & Nuxt guide](./vue)
- [SSR · Nuxt](./ssr#nuxt)

::::

:::: framework solid

## Solid

::: tip Framework
**Solid** · `tanstack-fetch/solid`
:::

| Import                 | What you get                    |
| ---------------------- | ------------------------------- |
| `tanstack-fetch/solid` | `FetchProvider` / `useFetch` / `useSse` |

- [Solid guide](./solid)
- [SSE · Solid](./sse#solid)

::::

:::: framework solid-start

## SolidStart

::: tip Framework
**SolidStart**
:::

- [Solid guide](./solid)
- [tRPC · SolidStart](/recipes/trpc#3-solidstart--tanstack-query)

::::

:::: framework angular

## Angular

::: tip Framework
**Angular** · `tanstack-fetch/angular`
:::

| Import                   | What you get                                      |
| ------------------------ | ------------------------------------------------- |
| `tanstack-fetch/angular` | `provideFetchClient` / `injectFetch` / `useSse` |

- [Angular guide](./angular)

::::

:::: framework svelte

## Svelte / SvelteKit

::: tip Framework
**Svelte** · `tanstack-fetch/svelte`
:::

| Import                  | What you get                                 |
| ----------------------- | -------------------------------------------- |
| `tanstack-fetch/svelte` | `setFetchClient` / `useFetch` / `useSse` |

- [Svelte guide](./svelte)

::::
