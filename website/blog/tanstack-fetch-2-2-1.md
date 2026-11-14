---
title: 'tanstack-fetch 2.2.1: SSE reconnects and SSR fixes'
titleTemplate: false
description: 'tanstack-fetch 2.2.1 fixes 31 bugs: relative baseUrl, createTRPCFetch from npm, SSE reconnects with Last-Event-ID, SSR leaks in Svelte and Vue, a DevTools XSS.'
date: 2026-11-14
category: Releases
tags: ['Core', 'SSE', 'Errors']
cover: /images/blog-2-2-1-cover.jpg
---

# tanstack-fetch 2.2.1: SSE reconnects, relative baseUrl and SSR safety

<p class="blog-meta">November 14, 2026</p>

![tanstack-fetch 2.2.1: 31 bug fixes](/images/blog-2-2-1-cover.jpg)

**2.2.1** is a bug-fix release with no new features. We read through every entry point and fixed 31 bugs. Each fix has a regression test. Upgrade if any of these affect you:

- **`baseUrl: '/api'` works**: a relative (or missing) `baseUrl` threw `Invalid URL` before any request was sent
- **`createTRPCFetch(api)` works from npm**: the published build threw "pass CreateFetchOptions or a client from createFetch()"
- **SSE reconnects after a dropped stream** and sends `Last-Event-ID`, as the `sse-resume` docs promised
- **No cross-request leaks in SSR**: Svelte no longer shares one client between requests, and Vue no longer opens streams on the server
- **DevTools XSS closed**: a response header was rendered as HTML in the panel

## Upgrade

```bash
npm install tanstack-fetch@2.2.1
```

A few fixes change behaviour that code may have depended on, by accident or not. They're listed under [Behaviour changes](#behaviour-changes) below.

## Security

### Svelte: one client per request on the server

`setFetchClient()` stored the client in a module-level variable as a fallback for code outside components. On the server, that module is shared by **every** request. In SvelteKit, request A's layout could set a client carrying A's cookies or token, and a `useFetch()` running for request B could pick it up.

The fallback is now browser-only. On the server, the client comes from Svelte context and nothing else. For `load` functions, import the client from `api.server.ts` (the migrate scaffold creates it). See [SvelteKit SSR](/guide/svelte#sveltekit-ssr).

### DevTools: request data is never HTML

The panel built its rows and summary with `innerHTML`, inserting the method, path, caller file and mock route name. The mock route name comes from the `x-tanstack-fetch-mock` **response header**, so a server (or anything in between) could send `<img src=x onerror=…>` and run script in your page when you clicked the row. Every element is now built with `textContent`, and no `innerHTML` is left in the DevTools code.

## Core HTTP client

### Relative `baseUrl`

```ts
const api = createFetch({ baseUrl: '/api' })
await api.get('/users') // 2.2.0: TypeError: Invalid URL · 2.2.1: GET https://your.site/api/users
```

The URL was built with `new URL(path)` and no base, so a relative `baseUrl`, or no `baseUrl` at all, always threw, even in the browser where the docs recommend `'/api'`. It now resolves against `location.href`. On the server, where there is no location, you get a clear error asking for an absolute `baseUrl` instead of a raw `TypeError`.

### `createTRPCFetch(api)` in the published package

`createTRPCFetch` looks up the options a client was created with in a registry. Each entry point (`tanstack-fetch`, `/sse`, `/trpc`, …) is bundled separately, so `/trpc` had its **own empty copy** of that registry, and every client created by the main entry was unknown to it. The tests ran against the source, where there is a single copy, so they never caught it. The registry now lives on `globalThis` under `Symbol.for('tanstack-fetch.clientOptions')`, so every bundle shares one copy.

### Interceptor errors keep their identity

An error thrown in `onResponse` / `onResponseError` (a status handler that redirects, or a schema validator) was caught by the network-error branch. It became `FetchError { code: 'NETWORK_ERROR', status: 0 }`, `onRequestError` ran, and a retry interceptor could **send the request again**, including a POST the server had already answered.

```ts
createFetch({
  onUnauthorized: () => {
    throw redirect('/login')
  },
})
// 2.2.0: FetchError NETWORK_ERROR (and maybe a retry) · 2.2.1: your redirect error
```

### Aborting with a reason

`controller.abort(new Error('user cancelled'))` makes fetch reject with that error, not an `AbortError`. It wasn't recognised as an abort, so it became `NETWORK_ERROR` and was retried up to `maxRetries`. A request whose signal is aborted now always rejects with the abort reason and is never retried.

### FormData keeps its boundary

With a client-level `headers: { 'content-type': 'application/json' }`, a `FormData` body was sent with that content type and the server couldn't find the multipart boundary. `FormData` bodies now drop any inherited `content-type`, so fetch sets `multipart/form-data; boundary=…` itself. The XHR upload path already did this.

### `onServerError` alongside `onStatus[500]`

```ts
createFetch({ onStatus: { 500: reportCrash }, onServerError: showBanner })
```

With both set, a `503` reached neither handler. Now `500` goes to `onStatus[500]` and every other 5xx goes to `onServerError`.

### `Retry-After` with invalid values

`Retry-After: -5` or `Retry-After: soon 5` parsed as `0` (retry immediately) because `Date.parse` accepts surprisingly loose input. Only non-negative numbers and real HTTP dates are used now; anything else falls back to the default delay.

### `{ action: 'drop' }` in `onRequest`

It was accepted by the types but ignored, so the request was sent anyway. It now cancels the request: the call rejects with `FetchError { code: 'REQUEST_DROPPED', status: 0 }` without calling fetch, `onRequestError` or retry. In `onResponse` / `onResponseError`, `drop` acts like `continue`.

### No listener leak without `AbortSignal.any`

In runtimes without `AbortSignal.any` (Safari before 17.4, older Node), combining your `signal` with the timeout added a listener to your signal on every request and never removed it. A long-lived app-wide `AbortController` collected one listener per request. Each request now removes its listeners when it finishes.

Without `AbortSignal.any`, `api.stream()` and tRPC can still keep one listener for each completed call on a signal that is never aborted, because their response body is read after the request returns. Removing the listener there would stop your `signal` from cancelling that read.

## SSE

### Reconnects after a dropped stream

Only a non-OK status when the stream **opened** went through `onSseError` → `onSseReconnect`. A connection that dropped mid-stream, or a `fetch` that failed with a network error, went straight to your code as an exception. So the `sse-resume` plugin never got to send `Last-Event-ID`.

Now every failure goes through the same path:

```ts
const api = createFetch({ baseUrl, plugins: ['sse-resume'] })

for await (const event of api.sse<Order>('/orders/stream')) {
  // server sends id: 7, then the connection drops
  // → reconnects after 1s with `Last-Event-ID: 7` and continues from event 8
}
```

- `sse-resume` now reconnects on its own after network errors, drops and `5xx` responses. A `4xx` fails without retrying.
- Headers you set in `onSseReconnect` are sent on the new connection.
- The retry budget (`maxRetries`, default 2) resets whenever an event arrives. Without the reset, a stream that stays open for hours would get only two reconnects in its whole life.
- `close()` or an abort during the wait before a reconnect now stops it. Before, the reconnect still happened.
- `onSseClose` interceptors run exactly once, on a normal end, an abort or an error, so DevTools no longer shows errored streams as open.

### `body` is sent

`api.sse('/chat', { body: { prompt } })`, the usual shape for LLM streaming, silently sent a `GET` without the body. The method is now `GET` by default and `POST` when a body is set, the same as `api.stream()`, and an `onRequest` interceptor can change it.

### Spec-compliant parsing

- A `\r\n` split across two network chunks no longer ends the event early. `"data: a\r"` + `"\ndata: b\r\n\r\n"` is one event `"a\nb"`, not two.
- `id:`-only blocks (checkpoints with no data) now update the last event id, so a resume starts from the right place.
- A bare `data` line adds an empty line, trailing spaces in the value are kept, and blocks with no data (`event:`-only, `retry:`-only) are not dispatched.

### `close()` stops delivery

Calling `close()` inside `onMessage` still delivered every event already buffered from the same network chunk. After a re-subscribe in React or Vue, those stale events overwrote `data`. Delivery now stops at `close()`.

## WebSocket

- **`retries` runs out.** Every successful open reset the attempt counter, so with `reconnect: { retries: 2 }`, a server that accepted and then closed with `1011` was reconnected forever at the base delay (52 sockets in 400 ms in our repro). The counter now resets only after a socket has stayed open for 5 seconds.
- **An already-aborted `signal`** never connects and now calls `onClose` once. Before, `onClose` never fired.

## Framework adapters

### Vue / Nuxt: no connections during SSR

`useSse` and `useWs` connected from an `immediate` watcher, which also runs during server rendering, and Vue never runs `onScopeDispose` on the server. Every SSR request opened a stream (or an authenticated WebSocket that reconnected) that was never closed. They now connect only in the browser. During SSR, `status` is `'disconnected'`, and the connection opens after hydration.

### Vue / React: late events from a replaced connection

When `path`, `query` or `params` changed, the old connection's `onClose` could arrive after the new one had set `'connecting'`, and flip the status back to `'disconnected'`. Late messages and errors could overwrite `data` and `error` too. Callbacks from a connection that has been replaced or unmounted are now ignored.

## DevTools

- **Concurrent requests keep their own entry.** Without the trace plugin, every request got the id `anon:0`, so two requests in flight overwrote each other's row, timing and status. During SSR with trace on, requests for the same page shared an id too. Each call now gets a unique id, which all of its retries share.
- **Call graph in Vite, Firefox and Safari.** Stack frames with a port (`http://localhost:5173/src/api/user.ts?t=1:10:5`) and the `fn@url:line:col` format used by Firefox and Safari weren't parsed, so "Called from" was always empty in Vite dev. Dev-server URLs now map to project paths (`src/api/user.ts`), and "open in editor" uses Vite's `/__open-in-editor` for them.

## tRPC

- **`baseUrl` paths are kept.** `toAbsoluteUrl` used `new URL(url, baseUrl)`, which drops the path, so `https://api.x.com/v1` plus `/trpc` called `https://api.x.com/trpc`. It now joins the two like the core client does: `https://api.x.com/v1/trpc`.
- **No silent `localhost` on the server.** A relative tRPC URL during SSR quietly became `http://localhost/...`. It now throws an error that asks for an absolute `baseUrl` or link `url`.
- **The timeout timer is cleared** when each attempt ends, so it can no longer cut off a streamed response (`httpBatchStreamLink`) after `fetch` has returned.

## CLI

The codemods could write code that compiled but failed at runtime. Now, when the CLI can't rewrite a call safely, it leaves it unchanged and reports it instead.

### `migrate`

- **`api` is imported.** Rewritten files called `api.get(...)` but only imported `createFetch`, so they threw `ReferenceError: api is not defined`. `--write` now adds `import { api } from '…/lib/api'`, relative to the file, pointing at the scaffold. If there is no api module (for example with `--no-scaffold`), the file is left unchanged and reported.
- **ky `.json<T>()`** is now removed, and the type moves onto the call: `ky.get(url).json<User>()` → `api.get<User>(url)`. Calls with nested parentheses or template literals are handled too. Before, `.json<User>()` was left behind and threw `.json is not a function`.
- **axios `params` in bodies.** `params:` was renamed to `query:` anywhere inside `post` / `put` / `patch` arguments, which changed request bodies like `{ params: ['a'] }`. Now it's renamed only as a top-level key of the config argument. The same applies to ky `searchParams`.
- **Import placement.** The new import went above `'use client'`, which made Next.js treat the file as a Server Component, and above shebangs, which broke the script. It now goes after both. Files whose first import spans several lines also get the import now.
- **No duplicate imports** with `--from all`.
- **Scaffolds don't throw in the browser.** The React (Vite) scaffold read `process.env`, and the generic and Nuxt scaffolds did too, which throws `ReferenceError: process is not defined` in a browser build. React now uses `import.meta.env.VITE_API_URL` only (Next.js users should use `--framework nextjs`), and the others guard `process` with `typeof`.

### `generate`

The OpenAPI generator now produces valid TypeScript for real-world specs:

- Keys that aren't identifiers are quoted: `'content-type'?: string`, `'@id'?: string`
- Names that collide get suffixes: `user-profile` and `user_profile` → `UserProfile`, `UserProfile2`; `getUser` and `get_user` → `getUser`, `getUser2`
- Path-level `parameters` and `#/components/parameters` `$ref`s are used. Before, `/users/{id}` declared at path level got no `params` type and threw `missing path param id` at runtime.

## Docs site

- Every page showed the same "last updated" date, because the deploy used a shallow git clone. Sitemap `lastmod` and `dateModified` are now per page.
- The "Raw skill file" link on [AI skill](/guide/skill) returned 404.

## Behaviour changes

All of these are fixes, but code that relied on the old behaviour will notice:

| Before                                                              | 2.2.1                                         |
| ------------------------------------------------------------------- | --------------------------------------------- |
| Errors thrown in `onResponse` / `onResponseError` → `NETWORK_ERROR` | The original error is rethrown, with no retry |
| `abort(reason)` → `NETWORK_ERROR`, retried                          | Rejects with `reason`, with no retry          |
| `drop` in `onRequest` → request sent                                | Rejects with `FetchError` `REQUEST_DROPPED`   |
| Svelte `setFetchClient` outside a component works on the server     | Server uses component context only            |
| Vue `useSse` / `useWs` connect during SSR                           | Browser only                                  |

| tRPC relative URL on the server → `http://localhost/...` | Throws: set an absolute `baseUrl` or link `url` |
| DevTools entry ids `anon:0` | Unique per call, e.g. `req#3:0` |
| DevTools `fileName` for dev-server frames `/src/x.ts` | Project-relative `src/x.ts` |

| SSE `event:`-only block delivered with `data: ''` | Not delivered (per spec) |
| SSE with `body` → `GET` without the body | `POST` with a JSON body |
| `sse-resume` → no reconnect after a drop | Reconnects after drops and 5xx (1s delay) |
| WebSocket attempt count reset on every open | Reset after 5s of stable connection |
| migrate React scaffold read `NEXT_PUBLIC_API_URL` | `VITE_API_URL` only; use `--framework nextjs` for Next.js |

## Bundle size

| Import                    |  2.2.0 |  2.2.1 |
| ------------------------- | -----: | -----: |
| `tanstack-fetch`          | 3.71KB | 3.97KB |
| `tanstack-fetch/sse`      | 6.46KB | 6.96KB |
| `tanstack-fetch/live`     | 8.88KB | 9.40KB |
| `tanstack-fetch/plugins`  | 1.22KB | 1.26KB |
| `tanstack-fetch/trpc`     | 3.28KB | 3.80KB |
| `tanstack-fetch/devtools` | 8.85KB | 9.08KB |

The core grows by about 260 bytes, mostly relative-URL resolution, the separate try blocks that keep interceptor errors distinct from network errors, and `drop` handling. Most of the `/sse` and `/live` growth is the reconnect path and the spec-compliant parser.

## Known limits

These came up during the review but are not fixed in 2.2.1:

- Solid, Svelte and Angular `useSse` / `useWs` read their path and options once and don't re-subscribe when they change, unlike React and Vue. Changing that is an API change, so it's planned for a minor release.
- `generate` leaves path params with dashes (`/users/{user-id}`) literal at runtime, and schema names that start with a digit still produce an invalid type name.

See also: [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md) · [Errors](/guide/errors) · [Interceptors](/guide/plugins)
