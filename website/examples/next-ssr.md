---
title: Next.js SSR live demo
description: Live ssr-forward demo for Next.js — cookies and auth headers on the server, skipped in the browser.
---

# Next.js SSR

::: tip Framework
**React** · Next.js App Router · `ssr-forward`
:::

Click **Server prefetch** and inspect the request log — `ssr-forward` attaches Cookie / Authorization / `x-request-id`. In the browser the plugin **skips**.

<NextSsrDemo />

## App Router pattern

```ts
import { cookies } from 'next/headers'
import { createFetch } from 'tanstack-fetch'

export const createServerApi = async () =>
  createFetch({
    baseUrl: process.env.API_URL!,
    source: 'ssr',
    plugins: ['ssr-forward', 'trace', 'retry-idempotent'],
    incoming: async () => ({ cookie: (await cookies()).toString() }),
  })
```

Guide: [SSR — Next.js](/guide/ssr#nextjs) · Nuxt twin: [Nuxt SSR](/examples/nuxt-ssr) · example: [`examples/next-ssr`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)
