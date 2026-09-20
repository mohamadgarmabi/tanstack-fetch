---
title: Rate limit (429)
description: Handle HTTP 429 with onTooManyRequests and parseRetryAfter in tanstack-fetch.
---

# Rate limit (429)

Use the first-class **`onTooManyRequests`** shortcut (or `onStatus[429]`).

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  maxRetries: 2,
  onTooManyRequests: ({ context }) => {
    const delayMs = parseRetryAfter(context.response?.headers, 1000)
    // Option A — let the error throw (Query shows isError)
    console.warn('429 — wait', delayMs, 'ms')

    // Option B — ask the status interceptor to retry once
    // return { action: 'retry', delayMs }
  },
  onClientError: ({ status }) => {
    // any other 4xx without its own shortcut
    console.warn('4xx', status)
  },
})
```

## Retry with `Retry-After`

```ts
onTooManyRequests: ({ context }) => ({
  action: 'retry',
  delayMs: parseRetryAfter(context.response?.headers, 2000),
})
```

`parseRetryAfter` accepts delay-seconds (`3`) or an HTTP-date and returns milliseconds.

## Try it

Open the [live playground](/examples/playground) and click **429**.

Related: [Configuration](/guide/configuration) · [Errors](/guide/errors)
