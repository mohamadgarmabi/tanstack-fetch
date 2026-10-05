# Changelog

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
