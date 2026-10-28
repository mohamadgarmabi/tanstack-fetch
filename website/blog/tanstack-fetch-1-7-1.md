---
title: 'tanstack-fetch 1.7.1: timeouts, URLs, binary bodies, and honest error statuses'
titleTemplate: false
description: Patch release — ports and query colons no longer break path params, timeouts reject with TimeoutError, timers stop leaking, Uint8Array / ReadableStream bodies send as bytes, and HTML 502s keep their status.
date: 2026-10-18
category: Releases
tags: ["Core","Errors"]
cover: /images/blog-1-7-1-cover.jpg
---

# tanstack-fetch 1.7.1: timeouts, URLs, binary bodies, and honest error statuses

<p class="blog-meta">October 18, 2026</p>

![tanstack-fetch 1.7.1: timeouts, URLs, errors](/images/blog-1-7-1-cover.jpg)

**1.7.1** is a bug-fix release for the core request path. No new APIs. One behavior change for timeouts, covered [below](#upgrade-notes).

## Upgrade

```bash
npm install tanstack-fetch@1.7.1
```

## At a glance

| Area | Before 1.7.1 | 1.7.1 |
| --- | --- | --- |
| `http://localhost:8080/users` | throws `missing path param "8080"` | works |
| `/search?t=10:30` | throws `missing path param "30"` | works |
| `timeoutMs` elapsed | `FetchError` · `NETWORK_ERROR` | `TimeoutError` · `isAbortError` is `true` |
| Successful request | timeout timer keeps running | timer cleared |
| `body: new Uint8Array(…)` | sent as `{"0":1,"1":2}` JSON | sent as raw bytes |
| `body: ReadableStream` | JSON-encoded | streamed (`duplex: 'half'`) |
| 502 with an HTML body | `PARSE_ERROR`, interceptors skipped | `HTTP_ERROR` · status 502 · interceptors run |

## 1. Ports and query colons are not path params

Path params are filled from `:id` / `{id}`. The matcher used to scan the **whole** string, so a port or a time in the query looked like a param:

```ts
// before 1.7.1 — both threw
await api.get('http://localhost:8080/users/:id', { params: { id: '1' } })
await api.get('/search?t=10:30')
```

Now only the **pathname** is scanned. `scheme://host:port`, `?query` and `#hash` are left alone:

```ts
await api.get('http://localhost:8080/users/:id?at=10:30', { params: { id: '1' } })
// → http://localhost:8080/users/1?at=10:30
```

This mostly bit SSR setups that call a local origin (`http://localhost:3000/api/...`).

## 2. Timeouts are aborts, not network errors

A request that hit `timeoutMs` used to surface as a `FetchError` with `code: 'NETWORK_ERROR'`, which you couldn't tell apart from a dropped connection. It also went through `onRequestError` interceptors, so a custom retry interceptor would retry it.

In 1.7.1 a timeout rejects with a `TimeoutError` (the same name as `AbortSignal.timeout()`), and `isAbortError` recognizes it, as the [Errors guide](/guide/errors) always said it did:

```ts
import { isAbortError, isFetchError } from 'tanstack-fetch'

try {
  await api.get('/report', { timeoutMs: 5_000 })
} catch (error) {
  if (isAbortError(error)) {
    if ((error as Error).name === 'TimeoutError') {
      toast.error('Request timed out')
    }
    // plain AbortError = user / Query cancelled
  } else if (isFetchError(error)) {
    // HTTP or network failure
  }
}
```

## 3. No more leaked timeout timers

Every request starts a timer for `timeoutMs` (default **30 s**). It used to be cleared only when the signal aborted, so each **successful** request left a timer pending for the full timeout. In Node, SSR and serverless that kept the process alive, and timers piled up under load.

Now the timer is cleared as soon as the attempt finishes. It's also `unref()`'d, so it never keeps a Node process alive on its own.

## 4. Binary bodies send as bytes

`encodeBody` let `ArrayBuffer` through but not its views, so typed arrays were JSON-encoded:

```ts
await api.post('/bytes', { body: new Uint8Array([1, 2, 3]) })
// before: body '{"0":1,"1":2,"2":3}', content-type: application/json
// 1.7.1:  the 3 raw bytes, no content-type forced
```

Sent as-is now: `string`, `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer`, **typed arrays / `DataView`**, and **`ReadableStream`**. Stream bodies set `duplex: 'half'`, which Node's fetch requires. Plain objects are still JSON.

## 5. Error responses keep their status

Gateways and proxies often send an HTML error page with a JSON `content-type`. The body was parsed **before** error interceptors ran, so a 502 with HTML threw `PARSE_ERROR`:

- the real status was buried
- `onResponseError` never ran, so **refresh-token**, **retry-idempotent** and status handlers like `onServerError` were skipped.

In 1.7.1, a non-2xx response whose body isn't valid JSON keeps its HTTP status. Its raw text becomes `error.body`, and every `onResponseError` interceptor runs:

```ts
try {
  await api.get('/gateway')
} catch (error) {
  if (isFetchError(error)) {
    error.status // 502
    error.code // 'HTTP_ERROR'
    error.body // '<html>Bad Gateway</html>'
  }
}
```

`PARSE_ERROR` is now only thrown for **2xx** responses with invalid JSON. The full table is in [Errors → Error codes](/guide/errors#error-codes).

## Upgrade notes

Only one change can affect existing code: **timeouts**.

- If you detected timeouts with `error.code === 'NETWORK_ERROR'`, switch to `isAbortError(error)` (and `error.name === 'TimeoutError'` to tell it apart from a cancel).
- Timeouts no longer reach `onRequestError` interceptors, so custom retry logic there won't retry them anymore. To retry on timeout, catch the `TimeoutError` at the call site or rely on TanStack Query's `retry`.

Everything else is a pure fix. Each one ships with a regression test.

See also: [Errors](/guide/errors) · [Error API](/api/errors) · [FetchClient options](/api/fetch-client) · [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)
