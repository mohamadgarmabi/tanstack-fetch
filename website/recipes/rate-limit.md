---
title: Rate limit (429)
description: Handle HTTP 429 with createStatusInterceptor and parseRetryAfter in tanstack-fetch.
---

# Rate limit (429)

![Rate limit (429)](/images/page-recipes-rate-limit.jpg)

**Problem:** the API answers `429 Too Many Requests`, often with a `Retry-After` header that says how long to wait. Retrying at once makes it worse; giving up shows the user an error they didn't need to see.

**Solution:** handle `429` in `createStatusInterceptor` from `tanstack-fetch/plugins`, read the wait with `parseRetryAfter`, and return `{ action: 'retry', delayMs }`.

## Handle HTTP 429 with Retry-After

```ts
import { createFetch, parseRetryAfter } from 'tanstack-fetch'
import { createStatusInterceptor } from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  maxRetries: 2,
  interceptors: [
    createStatusInterceptor({
      429: ({ context }) => ({
        action: 'retry',
        delayMs: parseRetryAfter(context.response?.headers, 2000),
      }),
    }),
  ],
})
```

What happens on a `429`:

1. The status handler runs before any error is thrown and asks for a retry after `delayMs`.
2. The client waits, then sends the same request again: same method, URL, headers and body. Interceptors such as auth run again, so a refreshed token is picked up.
3. If the API still answers `429` once `maxRetries` (default `2`) retries are used, the call rejects with a `FetchError` with `status: 429`. Its `headers` still hold `Retry-After`.

The built-in `retry-idempotent` plugin only covers `502`, `503` and `504`. It does not retry `429`.

::: tip Option shortcut
`createFetch` from `tanstack-fetch/sse` / `/live`, `createTRPCFetch` options and the framework providers also accept `onTooManyRequests` (and `onClientError` for any other 4xx). They take the same handler: `onTooManyRequests: ({ context }) => ({ action: 'retry', delayMs: … })`.
:::

## How `parseRetryAfter` reads the header

```ts
parseRetryAfter(headers: Headers | undefined, fallbackMs?: number): number | undefined
```

| `Retry-After` value             | Result                                      |
| ------------------------------- | ------------------------------------------- |
| `3`                             | `3000`                                      |
| `1.5`                           | `1500`                                      |
| `Wed, 21 Oct 2026 07:28:00 GMT` | Milliseconds until that time, `0` if passed |
| missing                         | `fallbackMs`                                |
| `-5`, `soon 5`, any other junk  | `fallbackMs` (since 2.2.1; before, `0`)     |

Without `fallbackMs`, missing or invalid values return `undefined`. A retry with no `delayMs` happens at once, so always pass a fallback.

## Cap the wait, or give up

A server can send `Retry-After: 3600`. The client will wait that long if you let it. Cap the delay, or let the error through when the wait is too long for a person to sit through:

```ts
createStatusInterceptor({
  429: ({ context }) => {
    const waitMs = parseRetryAfter(context.response?.headers) ?? 2000
    if (waitMs > 10_000) return // too long: throw the 429 and show a message
    return { action: 'retry', delayMs: waitMs }
  },
})
```

Returning nothing lets the `FetchError` throw. Show it in the UI with `parseRetryAfter(error.headers)`:

```ts
if (isFetchError(error) && error.status === 429) {
  const seconds = Math.ceil((parseRetryAfter(error.headers) ?? 0) / 1000)
  showToast(`Too many requests. Try again in ${seconds}s.`)
}
```

## Abort during the wait

The wait listens to the request's `signal`. When TanStack Query cancels the query (unmount, key change) or you abort, the wait stops at once and the call rejects with the abort reason (an `AbortError` by default, matched by `isAbortError`). It is not retried.

`timeoutMs` applies to each attempt on its own and does not include the wait, so a 5 s `Retry-After` does not trip a 3 s timeout.

## Retrying POST: idempotency

The status interceptor retries **any** method. A `429` usually means the server rejected the request before doing any work, but that depends on your API and any gateway in front of it. For writes that must not run twice (payments, orders), send an idempotency key. It is created once per call, so every retry sends the same key:

```ts
await api.post('/payments', {
  body: { amount: 4200 },
  headers: { 'idempotency-key': crypto.randomUUID() },
})
```

Or retry only safe methods:

```ts
createStatusInterceptor({
  429: ({ context }) =>
    context.request.method === 'GET'
      ? { action: 'retry', delayMs: parseRetryAfter(context.response?.headers, 2000) }
      : undefined,
})
```

## Alternative: let TanStack Query retry

If you prefer Query's retry, leave the status handler out and read the header from the error:

```ts
import { QueryClient } from '@tanstack/react-query'
import { isFetchError, parseRetryAfter } from 'tanstack-fetch'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retryDelay: (failureCount, error) =>
        isFetchError(error) && error.status === 429
          ? (parseRetryAfter(error.headers) ?? 2000)
          : Math.min(1000 * 2 ** failureCount, 30_000),
    },
  },
})
```

Pick one layer. With both, each Query retry runs the client's own retries, and the request count multiplies.

## Try it

Open the [live playground](/examples/playground) and click **429**.

## Related

- [Errors](/guide/errors): status handlers and `FetchError`
- [Error API](/api/errors): `status`, `headers` and error codes
- [Configuration](/guide/configuration): `maxRetries`, `timeoutMs` and option shortcuts
- [Plugin API](/api/plugins): `createStatusInterceptor` and `retry-idempotent`
