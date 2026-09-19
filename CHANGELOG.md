# Changelog

## 1.1.0

### Features

- **tRPC integration** via `tanstack-fetch/trpc`: `createTRPCFetch`, `createTRPCFetchLink`, `createTRPCFetchClient`
- Reuse the same `createFetch` auth / plugins / status handlers with tRPC
- Works with React Query, TanStack Router, and TanStack Start (relative `/api/trpc` URLs)

### Docs

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
