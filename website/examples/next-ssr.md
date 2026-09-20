---
title: Next.js SSR live demo
description: Live ssr-forward demo — cookies and auth headers on the server, skipped in the browser.
---

# Next.js SSR

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

Guide: [SSR & Next.js](/guide/ssr) · example: [`examples/next-ssr`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/next-ssr)
