---
title: 'tanstack-fetch 2.1.0: abortable retries, safer token refresh'
titleTemplate: false
description: tanstack-fetch 2.1.0 fixes cancelling during a retry delay, literal colons in paths like gemini:generateContent, a refresh-token race that could rotate a session out, and retries of stream bodies. It adds array query values, parseAs arrayBuffer / stream and a tanstack-fetch/full entry.
date: 2026-11-07
category: Releases
tags: ['Core', 'Auth', 'Errors']
cover: /images/blog-2-1-0-cover.jpg
---

# tanstack-fetch 2.1.0: abortable retries, a safer refresh token and array query values

<p class="blog-meta">November 7, 2026</p>

![tanstack-fetch 2.1.0: abortable retries · safer refresh](/images/blog-2-1-0-cover.jpg)

**2.1.0** is a fix-first release. No breaking changes. Upgrade and you get:

- **Cancel means cancel**: aborting during a retry delay rejects immediately
- **Literal colons in paths**: `/models/gemini:generateContent` no longer asks for a `generateContent` param
- **One refresh per rotation**: a late `401` no longer starts a second refresh
- **Array query values**, `parseAs: 'arrayBuffer' | 'stream'` and a `tanstack-fetch/full` entry

## Upgrade

```bash
npm install tanstack-fetch@2.1.0
```

## Fixed

### Cancelling during a retry delay

With `Retry-After: 5` (or any backoff), an HTTP request waited out the whole delay even after its `signal` was aborted. TanStack Query aborts on unmount and on `queryKey` change, so the query stayed pending for seconds. The delay now listens to your `signal` and rejects with `AbortError` immediately, without sending the next attempt.

```ts
useQuery({
  queryKey: ['report', id],
  // unmount during a 5s Retry-After → rejects now, no second fetch
  queryFn: ({ signal }) => api.get('/reports/:id', { params: { id }, signal }),
})
```

### Colons inside a path segment

`:name` is now a path param only at the **start** of a segment, both at runtime and in the types:

```ts
await api.post('/v1/models/gemini:generateContent', { body }) // literal path, no params
await api.get('/users/:id', { params: { id: 1 } }) // → /users/1
```

Before, the first call threw `missing path param "generateContent"` and TypeScript asked for that param too.

### Refresh token: no second refresh on a late 401

The interceptor already shared one in-flight refresh between parallel `401`s. But a request sent with the **old** token whose `401` arrived after the refresh had **finished** started a new refresh. With rotating refresh tokens, that second call can invalidate the session the first one just created.

The interceptor now knows which refresh each request was sent after. A late `401` just resends the request with the new token:

```
A ──(old token)──────────────────────► 401 → retry with new token ✓
B ──(old token)──► 401 → refresh() ✓ → retry ✓
                       refresh() called once
```

It also fixes the reverse case. A request that was retried for another reason (say a `502` through `retry-idempotent`) and then got a `401` used to skip the refresh, because the check was `attempt > 0`. Each request now refreshes **at most once**, tracked per call, so `401 → refresh → 401` still can't loop.

This works through a new `context.meta.state`, a plain object shared by every retry attempt of one request. Your own interceptors can use it for per-call flags too.

### Stream bodies are never retried

A `ReadableStream` body is consumed by the first attempt, so a retry used to fail with a confusing "locked stream" `TypeError`. Requests with a stream body now return the real error (`FetchError` with the `503`, etc.) instead of retrying.

## Added

### Array query values

```ts
await api.get('/users', { query: { ids: [1, 2], role: 'admin' } })
// → /users?ids=1&ids=2&role=admin
```

`QueryParams` accepts arrays of `string | number | boolean`, and each item is appended as its own `key=value`. `null` and `undefined` are still skipped.

### `parseAs: 'arrayBuffer' | 'stream'`

```ts
const bytes = await api.get<ArrayBuffer>('/files/:id', { params: { id }, parseAs: 'arrayBuffer' })
const body = await api.get<ReadableStream<Uint8Array>>('/export', { parseAs: 'stream' })
```

`'stream'` returns the raw `response.body` without reading it.

### `tanstack-fetch/full`

The full HTTP client (option shortcuts, `upload()`, progress events) lived only under `tanstack-fetch/sse`, which reads oddly when you don't use SSE. `tanstack-fetch/full` is the same build under a clearer name, and `/sse` keeps working.

```ts
import { createFetch } from 'tanstack-fetch/full'
```

### Correct types for CommonJS

`require('tanstack-fetch')` now resolves to `.d.cts` declarations instead of the ESM `.d.ts`, so TypeScript projects using `module: node16` / `nodenext` with CJS get the correct types. CI now checks every entry with `publint` and `@arethetypeswrong/cli`, and runs the tests on Node 20, 22 and 24.

## Bundle size

| Import                   |  2.0.0 |  2.1.0 |
| ------------------------ | -----: | -----: |
| `tanstack-fetch`         | 3.57KB | 3.68KB |
| `tanstack-fetch/sse`     | 6.33KB | 6.43KB |
| `tanstack-fetch/live`    | 8.75KB | 8.84KB |
| `tanstack-fetch/plugins` | 1.13KB | 1.22KB |

About 100 bytes for the fixes above.

## Good to know

Timeouts and aborts reject with the platform `TimeoutError` / `AbortError`, **not** `FetchError`. That has always been true, and it is now stated in the README. Check them with `isAbortError(error)`. See [Errors](/guide/errors).

See also: [Refresh token recipe](/recipes/refresh-token) · [Request options](/api/fetch-client#request-options) · [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)
