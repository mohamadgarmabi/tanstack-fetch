---
title: Rate limit (429)
description: Handle HTTP 429 with createStatusInterceptor and parseRetryAfter in tanstack-fetch.
---

# Rate limit (429)

![Rate limit (429)](/images/page-recipes-rate-limit.jpg)

Map **`429`** in **`createStatusInterceptor`** from `tanstack-fetch/plugins`.

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'
import { createStatusInterceptor } from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  maxRetries: 2,
  interceptors: [
    createStatusInterceptor({
      429: ({ context }) => {
        const delayMs = parseRetryAfter(context.response?.headers, 1000)
        // Option A — let the error throw (Query shows isError)
        console.warn('429 — wait', delayMs, 'ms')

        // Option B — ask the status interceptor to retry once
        // return { action: 'retry', delayMs }
      },
      '4xx': ({ status }) => {
        // any other 4xx without its own handler
        console.warn('4xx', status)
      },
    }),
  ],
})
```

::: tip
`createFetch` from `tanstack-fetch/sse` / `/live`, `createTRPCFetch` options and the framework providers still accept the `onTooManyRequests` / `onClientError` shortcuts.
:::

## Retry with `Retry-After`

```ts
createStatusInterceptor({
  429: ({ context }) => ({
    action: 'retry',
    delayMs: parseRetryAfter(context.response?.headers, 2000),
  }),
})
```

`parseRetryAfter` accepts delay-seconds (`3`) or an HTTP-date and returns milliseconds.

## Try it

Open the [live playground](/examples/playground) and click **429**.

Related: [Configuration](/guide/configuration) · [Errors](/guide/errors)
