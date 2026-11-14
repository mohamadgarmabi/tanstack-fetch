# Changelog

## 2.2.1

Bug-fix release. No new features. See [the release post](https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-2-2-1).

### Security

- Svelte: `setFetchClient` no longer keeps a module-level fallback client on the server, so one SvelteKit SSR request can't pick up another request's client (token, cookies). On the server the client comes from component context only
- DevTools: the panel no longer renders request data as HTML. A mock route name from the `x-tanstack-fetch-mock` response header, a URL or a caller file could run script in the page

### Fixed: core

- A relative `baseUrl` (e.g. `'/api'`) or no `baseUrl` resolves against `location.href` in the browser instead of throwing `TypeError: Invalid URL`; on the server it throws a clear error asking for an absolute `baseUrl`
- `createTRPCFetch(createFetch(...))` no longer throws in the published package: the client-options registry is shared across bundle entries via `globalThis[Symbol.for('tanstack-fetch.clientOptions')]`
- Errors thrown by `onResponse` / `onResponseError` interceptors (status handlers, validators) reject with the original error instead of `NETWORK_ERROR`, skip `onRequestError` and are never retried
- `controller.abort(reason)` with a custom reason rejects with that reason instead of being retried as `NETWORK_ERROR`
- `FormData` bodies drop an inherited `content-type`, so fetch sets `multipart/form-data` with its boundary
- `onServerError` runs for 5xx other than 500 even when `onStatus: { 500 }` is set
- `{ action: 'drop' }` from `onRequest` cancels the request (`FetchError`, `code: 'REQUEST_DROPPED'`); from `onResponse` / `onResponseError` it acts like `continue`
- `Retry-After` values like `-5` or `soon 5` use the fallback delay instead of 0
- No listener leak on a long-lived `signal` in runtimes without `AbortSignal.any` (HTTP requests)

### Fixed: SSE and WebSocket

- SSE: mid-stream drops and network errors go through `onSseError` → `onSseReconnect` → reconnect, like a failed open; headers set in `onSseReconnect` are sent; the retry count resets when an event arrives
- `sse-resume` reconnects on its own after network errors, drops and 5xx (1s delay) and sends `Last-Event-ID`; 4xx still fail
- SSE: `close()` or abort during a retry delay no longer reconnects
- SSE: `onSseClose` runs exactly once on error, abort and normal end
- SSE: `body` is sent; the method is `GET` by default and `POST` with a body, and `onRequest` can change it
- SSE parser: a `\r\n` split across chunks no longer splits an event; `id:`-only blocks update the last event id; bare `data` lines, trailing spaces and data-less blocks follow the spec
- SSE: `close()` inside `onMessage` stops delivery of already-buffered events
- WebSocket: `reconnect.retries` runs out for a server that accepts and then drops; the count resets only after 5s open
- WebSocket: an already-aborted `signal` never connects and calls `onClose` once

### Fixed: adapters

- Vue: `useSse` / `useWs` no longer connect during SSR (they leaked a stream or socket per request)
- Vue, React: late events from a replaced or unmounted connection no longer overwrite `status`, `data` or `error`

### Fixed: DevTools and tRPC

- DevTools: concurrent requests get unique entry ids (`req#3:0`) instead of all sharing `anon:0`
- DevTools: call graph parses Firefox / Safari frames and dev-server URLs with a port and query; dev-server files open through Vite's `/__open-in-editor`
- tRPC: a `baseUrl` with a path (`https://api.x.com/v1`) is kept; a relative URL on the server throws instead of calling `http://localhost`
- tRPC: the per-attempt timeout timer is cleared when the attempt ends

### Fixed: CLI

- `migrate --write` imports `api` into rewritten files; files where it can't be resolved are left unchanged and reported
- `migrate`: `ky.get(url).json<T>()` → `api.get<T>(url)`; nested parens and template literals are handled
- `migrate`: imports go after shebangs and `'use client'` / `'use server'`; multi-line first imports are handled; no duplicate imports with `--from all`
- `migrate` (axios): `params` → `query` only in the config argument, never inside bodies (same for ky `searchParams`)
- `migrate` scaffolds (React, Nuxt, generic) no longer throw `ReferenceError` for `process` in the browser; the React scaffold reads `VITE_API_URL` only
- `generate`: quotes non-identifier keys, de-dupes colliding type names and operationIds, and supports path-level `parameters` and `$ref` parameters

### Docs

- Per-page "last updated" dates (the deploy cloned only the latest commit); fixed the "Raw skill file" link

### Changed

- Entry sizes (gzip): core 3.97KB (was 3.71KB), `/sse` 6.96KB (was 6.46KB), `/live` 9.40KB (was 8.88KB), `/plugins` 1.26KB (was 1.22KB), `/trpc` 3.80KB (was 3.28KB), `/devtools` 9.08KB (was 8.85KB)

## 2.2.0

### Added

- **`tanstack-fetch/mock`** (1.82KB gzip, new entry): `createFetch({ mocks: createMocks({ routes }) })` answers requests from local handlers instead of the network, for HTTP, `upload()`, `api.sse()`, `api.stream()` (NDJSON), `api.ws()` and `createTRPCFetch`. Works on every entry, including the slim core; apps that never import it ship none of the mock code
  - `enabled` in `createMocks()` switches every mock; `enabled: false` on a route switches one (read per request, so it can change at runtime)
  - `path` is relative to `baseUrl` with `:id` / `{id}` params; first match wins; unmatched requests go to the real transport
  - HTTP handlers return data (JSON 200), a `Response` (as-is) or `undefined` (204); async generators stream as SSE (`sse: true`) or NDJSON
  - WebSocket routes (`ws: true`) get `send` / `close` / `onMessage` and may return a cleanup function
  - `delayMs` in `createMocks()` or per route simulates latency
  - Interceptors (auth, status handlers, retries, DevTools) still run for mocked requests
  - DevTools tags mocked requests with a **MOCK** badge and the matched route (`DevtoolsEntry.mock`); mocked HTTP / SSE / NDJSON responses carry an `x-tanstack-fetch-mock` header
  - New types: `FetchMocks`, `MockOptions`, `MockRoute`, `MockHttpRoute`, `MockWsRoute`, `MockRequest`, `MockWsConnection`
- **Docs**: [Mocking API routes](https://mohamadgarmabi.github.io/tanstack-fetch/guide/mocking) guide and [Mock your API: HTTP, SSE and WebSocket](https://mohamadgarmabi.github.io/tanstack-fetch/blog/mock-api-http-sse-websocket-tanstack-fetch) tutorial

### Changed

- Entry sizes (gzip): core 3.71KB (was 3.68KB), `/sse` 6.46KB (was 6.43KB), `/live` 8.88KB (was 8.84KB), `/devtools` 8.85KB (was 8.70KB)

## 2.1.0

### Fixed

- Aborting `signal` during a retry delay (backoff / `Retry-After`) now rejects immediately instead of waiting out the delay
- `:name` is a path param only at the start of a segment — `/models/gemini:generateContent` no longer throws `missing path param` (runtime and types)
- Refresh token: a 401 that arrives after another request already refreshed retries with the new token instead of refreshing again; a 401 after an earlier retry (e.g. 502) still refreshes
- Requests with a `ReadableStream` body are never retried (the stream is single-use); the error result is returned instead

### Added

- Array query values: `{ ids: [1, 2] }` → `?ids=1&ids=2`
- `parseAs: 'arrayBuffer' | 'stream'`
- `tanstack-fetch/full` alias of `tanstack-fetch/sse`
- CJS consumers get `.d.cts` types; CI runs Node 20/22/24, `publint` and `@arethetypeswrong/cli`
- `RequestContext.meta.state`: a per-call object shared by every retry attempt

## 2.0.0

### Breaking

- **Slim core**: `tanstack-fetch` drops from 5.14KB to **3.57KB** gzip. Core `createFetch` keeps `baseUrl`, `headers`, `source`, `incoming`, `timeoutMs`, `interceptors`, `fetch`, `credentials`, `maxRetries` (`CoreFetchOptions`)
  - Removed from core: `getToken`, `auth`, `plugins: [...]`, `onStatus` and the `onUnauthorized` / `onForbidden` / … / `onServerError` shortcuts. Use interceptors from `tanstack-fetch/plugins`: `createAuthInterceptor({ getToken })`, `createStatusInterceptor({ 401: fn, '5xx': fn })`, `createTraceInterceptor()`, …
  - Removed from the core client: `upload()` and `onUploadProgress` / `onDownloadProgress` (XHR)
  - **Unchanged**: `tanstack-fetch/sse`, `/live`, `/trpc` and the framework providers keep every option, `upload()` and progress events — switch the import to `tanstack-fetch/sse` for a drop-in upgrade
  - CLI `migrate` scaffolds now emit the interceptor style
- **Typed live params**: `api.sse` / `ws` / `transport` / `stream` and `useSse` / `useWs` (React, Vue, Solid, Svelte, Angular) type `params` like `api.get` — inferred from the URL, or `api.ws<Message, { id: number }>('/rooms/:id', { params })` with the path checked against the keys
  - Generic order now matches HTTP: `ws` / `transport` / `useWs` are `<Message, Params, Send>` (was `<Message, Send>`; use `NoParams` to skip); `sse` / `stream` / `useSse` are `<Message, Params>`
  - `generate` emits the params type for SSE / NDJSON operations
  - New exported types: `LiveParams`, `FetchMethodPath`, `FetchParamsConstraint`

### Fixes

- **Docs**: [tanstack-fetch 2.0.0](https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-2-0-0) release post
- **`api.stream()`** (NDJSON): sends `duplex: 'half'` for `ReadableStream` bodies (required by Node/undici), runs `onRequestError` on network failures (retry / short-circuit like HTTP), and aborting during a retry delay rejects immediately

## 1.8.0

### Features

- **`tanstack-fetch/live`**: new entry with every live transport — `api.sse()`, `api.ws()`, `api.transport()`, `api.stream()`. `tanstack-fetch/sse` is unchanged and stays small
- **`api.ws()`** — WebSocket on the same auth / interceptors / plugins as HTTP
  - `Authorization` header on Node 22+, Bun, Deno; browsers / workers need an explicit `authIn: 'query' | 'protocol'` (a token is never put in a URL by default)
  - Auto-reconnect (5 attempts, exponential backoff, max 30s) with a fresh token per attempt; failed token refreshes count as attempts
  - Ordered send queue until open, JSON frames parsed, absolute `ws(s)://` URLs, `signal`, `onClose` fires exactly once and closed sockets emit nothing
  - `createWebSocket` option for the `ws` package on Node < 22
- **`api.transport()`** — the same API over WebTransport (HTTP/3 datagrams); `webTransport` options (e.g. `serverCertificateHashes`), `createWebTransport` for polyfills
- **`api.stream()`** — NDJSON / JSON-lines over fetch: any method + body, full interceptor pipeline (status handlers, `refresh-token`, retry), header-only timeout, returns an `AsyncIterable` for `streamedQuery`
- **Live interceptor hooks**: `onLiveOpen`, `onLiveMessage` (`direction: 'in' | 'out'`), `onLiveClose` (with `error`); `context.meta.transport` is `'websocket' | 'webtransport' | 'ndjson'`
- **DevTools**: new **WS** (WebSocket / WebTransport) and **Stream** (NDJSON) tabs with a per-connection message log; `ws` / `stream` flags
- **CLI**: `generate` emits `api.stream` for `application/x-ndjson` / `jsonl` responses (imports `tanstack-fetch/live`); `doctor` flags raw `new WebSocket` / `new EventSource` and checks `signal` on `api.stream` in `queryFn`
- **Examples**: [`examples/ws-chat`](./examples/ws-chat), live WebSocket / WebTransport / NDJSON demos in the docs playground, and a [Cookbook](https://mohamadgarmabi.github.io/tanstack-fetch/examples/cookbook) with an example for every feature
- **`useWs`** in `tanstack-fetch/react`, `/vue`, `/solid`, `/svelte`, `/angular` (`transport: 'webtransport'` supported)
- **Docs**: [WebSocket, WebTransport & streams](https://mohamadgarmabi.github.io/tanstack-fetch/guide/websocket) guide; blog: [tanstack-fetch 1.8.0](https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-8-0)

### Fixes

- **Types**: absolute URLs (`https://…`) no longer infer an empty required path param from the scheme's `:`

## 1.7.1

### Fixes

- **URLs**: a port (`http://localhost:8080/...`) or a colon in the query / hash (`?t=10:30`) is no longer read as a path param — only the pathname is scanned for `:id` / `{id}`
- **Timeouts**: a timed-out request now rejects with a `TimeoutError` that `isAbortError` recognizes, instead of a `FetchError` with code `NETWORK_ERROR`
- **Timeouts**: the timeout timer is cleared when the request finishes and never keeps a Node / SSR process alive
- **Body**: typed arrays (`Uint8Array`, `DataView`, …) and `ReadableStream` are sent as-is instead of being JSON-encoded; stream bodies set `duplex: 'half'` for Node
- **Errors**: a non-2xx response whose body is not valid JSON (e.g. an HTML 502 page) keeps its HTTP status and runs `onResponseError` interceptors (refresh-token, retry); the raw text is in `error.body`. `PARSE_ERROR` is now only thrown for 2xx responses

### Docs

- **Errors guide**: new "Error codes" table (HTTP / parse / network / abort / timeout) + timeout-vs-cancel example
- **API reference**: `FetchError.body` raw-text case, `isAbortError` + `TimeoutError`, error `code` table, every `body` type sent as-is, pathname-only `params`, `timeoutMs` default (30 000)
- **Blog**: [tanstack-fetch 1.7.1](https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-7-1)

### Breaking-ish

- Timeouts no longer go through `onRequestError` interceptors, so custom retry interceptors stop retrying them. Code that checked `code === 'NETWORK_ERROR'` to detect timeouts should use `isAbortError(error)`

## 1.7.0

### Features

- **`onDownloadProgress`**: browser download progress on any request (`get` / `post` / …), same event shape as upload (`loaded` / `total` / `progress`) via XHR
- **`tanstack-fetch/solid`**, **`/svelte`**, **`/angular`**: inject client + `useSse` (parity with React/Vue)
- **`tanstack-fetch doctor`** (alias `--doctor`): health-check package.json + sources
  - Legacy clients (`axios` / `ky` / `ofetch`), `createFetch` count, missing `signal` in `queryFn`
  - Framework stack hints (react, vue, nuxt, nextjs, solid, angular, svelte, sveltekit)
- **migrate `--framework`**: `solid` · `angular` · `svelte` · `sveltekit` scaffolds
  - Works with `@tanstack/solid-query`, `@tanstack/angular-query-experimental`, `@tanstack/svelte-query`
  - `sveltekit` also scaffolds `api.server.ts` with `ssr-forward` + cookies
- **Docs**: Framework picker in the header (default All) filters framework sections on SSE / tRPC / Query / examples
  - Picker includes TanStack Start, SolidStart, Remix; Start + Query + Router context examples lead the tRPC / Query guides

## 1.6.3

### Fixes

- **migrate / ofetch**: detect and report Nuxt `$fetch` (regex no longer used `\b` before `$`)
- **migrate / ofetch**: keep `FetchError` (and `isFetchError`) when rewriting ofetch imports
- **migrate / axios**: preserve `AxiosError as Alias` → `FetchError as Alias`
- **migrate**: honor `--no-scaffold` when `--framework` is set
- **migrate**: reject `--scaffold` paths that escape the project root
- **migrate**: rewrite `baseURL` / `prefixUrl` only inside `createFetch({ … })` options
- **migrate / fetch**: only flag `res.ok` / `response.ok` (not unrelated `.ok`)
- **migrate**: skip symlinks + cyclic directory walks; ignore `out` / `.cache` / `vendor` / …; skip files over ~1.5MB

### Changes

- **migrate**: broader call-site coverage
  - axios: `import *`, `require`, `axios(url)`, `params` → `query`, `(await …).data` unwrap, instance `client.get` findings, `axios.defaults`
  - ky: instance `.json()` strip, `searchParams` → `query`
  - ofetch / `$fetch`: rewrite to `api.get/post/…` (incl. `method:`)
  - fetch: detect `void fetch` and `.then` chains

## 1.6.2

### Features

- **`tanstack-fetch migrate`**: scan and safely rewrite HTTP clients for TanStack Query
  - `--from axios|ky|ofetch|fetch|all`
  - `--framework react|vue|nuxt|nextjs` scaffold (provider / plugin / SSR)
  - React: asks whether to include `FetchProvider` (default: no); `--provider` / `--no-provider` skip the prompt
  - `--write` applies safe transforms; optional `src/lib/api.ts` scaffold
  - Alias: `tanstack-fetch migrate-axios` → `--from axios`
- Docs: [Migrate](https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate)

## 1.6.1

### Changes

- **Path-typed `params`**: keys inferred from `:param` / `{param}` URL patterns (no route map).
- Response + params: pass a **params map** as the second type argument.
  - `api.get<User, { id: number }>('/users/:id', { params: { id } })`
  - Path must contain matching `:id` / `{id}` for every key in the map
- `<Data>` only requires an options argument (path literal is lost by TypeScript)
- **Optional body typing** on `post` / `put` / `patch` / `request`:
  - `api.post<User, NoParams, CreateUser>('/users', { body })`
  - `api.post<User, { id: number }, CreateUser>('/users/:id', { params, body })`
- Dropped the experimental `createFetch<Routes>()` route map from 1.6.0.

### Breaking

- Removed `throwOnError` — HTTP helpers always return data on success and throw `FetchError` on failure.
- `api.get<User[]>('/users')` → `api.get<User[]>('/users', {})` (or pass real options) when using a response generic

## 1.6.0

### Features

- **Typed routes** (superseded in 1.6.1): optional `createFetch<Routes>()` route map.

## 1.5.0

### Features

- **`tanstack-fetch/vue`**: Vue 3 / Nuxt helpers — `createFetchPlugin`, `provideFetchClient`, `useFetch`, `useSse`
- Same SSE `status` model as React (`connecting` | `connected` | `disconnected` | `error`)
- Prefer `useSse({ client: api })` without a plugin; Nuxt: `nuxtApp.vueApp.use(createFetchPlugin({ client: api }))`

### Docs

- Guide + API: Vue & Nuxt (`/guide/vue`, `/api/vue`)

## 1.4.2

### Fixes

- **`useSse({ client })`**: pass the SSE client directly — **FetchProvider is no longer required**

### Docs

- React / SSE guides and `examples/sse-live` use `client: api` without a provider

## 1.4.1

### Fixes / Features

- **`useSse` status**: returns `status: 'connecting' | 'connected' | 'disconnected' | 'error'` instead of `isConnected`
- **`SseStatus` type** exported from `tanstack-fetch` and `tanstack-fetch/react`
- **`onOpen` timing**: fires when the SSE response is actually open (not when `subscribe` starts)

### Docs

- SSE / React guides and `examples/sse-live` updated for `status`

## 1.4.0

### Features

- **`tanstack-fetch/devtools`**: request dock for HTTP / SSE / SSR / tRPC — `setupDevtools(api)` one-liner, call graph with Cursor / Zed / VS Code picker, SSE event list, caller file label (e.g. `profile.hook.ts`)
- **SSE `onSseClose` interceptor hook**: stream end notifies listeners; DevTools marks SSE as `live` → `success`
- tRPC success path runs `onResponse` so DevTools / logging see timing

### Docs

- Live DevTools preview at `/examples/devtools` (Shift→ **Alt+Shift+F** / **⌥⇧F**)

## 1.3.0

### Features

- **`createRefreshTokenInterceptor`** (`tanstack-fetch/plugins`): structured refresh with **before** (time / `getExpiresAt` + `skewMs`) and **after** (first `401` → single-flight refresh → retry). Refresh via the same `api` client with `interceptors: { eject: ['refresh-token', 'auth'] }`.

### Docs

- Homepage: Why not axios, 30-second start, StackBlitz links, refresh-token showcase, `llms.txt`
- Recipe and comparison updated for before/after refresh
- **Agent skill**: `.agents/skills/tanstack-fetch` + install page (`npx skills add mohamadgarmabi/tanstack-fetch --skill tanstack-fetch`)

## 1.2.1

### Features

- **Path-typed `params`**: `api.get('/users/:id', { params: { id } })` infers required keys from `:param` / `{param}` patterns
- Export `PathParamsOf`, `ExtractPathParamKeys`, `pathParams()` helper
- Typed `params` on `get` / `post` / `put` / `patch` / `delete` / `upload` / `sse` / `useSse`

## 1.2.0

### Features

- **First-class 4xx status shortcuts**: `onBadRequest` (400), `onMethodNotAllowed` (405), `onRequestTimeout` (408), `onConflict` (409), `onGone` (410), `onPayloadTooLarge` (413), `onUnsupportedMediaType` (415), `onUnprocessableEntity` (422), **`onTooManyRequests` (429)**, `onUnavailableForLegalReasons` (451), plus **`onClientError`** (`4xx` catch-all)
- **`parseRetryAfter(headers)`** helper for rate-limit `Retry-After` delays
- Docs: live VitePress playgrounds (real `createFetch` + mock `fetch`), rate-limit recipe

## 1.1.0

### Features

- **tRPC integration** via `tanstack-fetch/trpc`: `createTRPCFetch`, `createTRPCFetchLink`, `createTRPCFetchClient`
- Reuse the same `createFetch` auth / plugins / status handlers with tRPC
- Works with React Query, TanStack Router, and TanStack Start (relative `/api/trpc` URLs)

### Docs

- VitePress site under [`website/`](./website) (GitHub Pages)
- Recipe: [`docs/recipes/trpc.md`](./docs/recipes/trpc.md)
- Example: [`examples/trpc`](./examples/trpc)

## 1.0.6

### Fixes

- Return the last `FetchError` (with HTTP status/body) when retry budget is exhausted, instead of a plain `Error` — keeps TanStack Query `isFetchError` / `error.status` working after token-refresh retries
- Honor SSE `onRequest` `retry` (reconnect) and error `short-circuit` (throw `FetchError`) instead of silently ending the stream
- Reject immediately on the XHR upload path when `AbortSignal` is already aborted
- Surface invalid JSON bodies as `PARSE_ERROR` with the real HTTP status (not `NETWORK_ERROR` / status `0`)
- `await` `handleResponse` so parse/network errors are caught correctly

### Docs / DX

- 30-second quickstart, `queryOptions` recipes, refresh-token interceptor example
- Minimal TanStack Query example under `examples/tanstack-query`
- CI workflow for PRs + CHANGELOG

## 1.0.5

- Upload API (`api.upload`, `createFormData`, `onUploadProgress`)
- Provenance-ready GitHub Actions publish workflow
- README landing / SEO pass

## 1.0.4

- Package metadata and docs updates

## 1.0.3 – 1.0.0

- Initial public releases: HTTP client, plugins, SSE, React bindings, OpenAPI CLI
