# Changelog

## 1.3.0

### Features

- **`createRefreshTokenInterceptor`** (`tanstack-fetch/plugins`): structured refresh with **before** (time / `getExpiresAt` + `skewMs`) and **after** (first `401` → single-flight refresh → retry). Refresh via the same `api` client with `interceptors: { eject: ['refresh-token', 'auth'] }`.

### Docs

- Homepage: Why not axios, 30-second start, StackBlitz links, refresh-token showcase, `llms.txt`
- Recipe and comparison updated for before/after refresh

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
