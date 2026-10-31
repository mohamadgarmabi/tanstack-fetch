---
title: FetchClient
description: FetchClient methods — get, post, put, patch, delete, upload, request — and typed path params.
---

# FetchClient

![FetchClient](/images/page-api-fetch-client.jpg)

Methods on the client returned by `createFetch`.

| Method                                      | Description                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `get` / `post` / `put` / `patch` / `delete` | Typed HTTP helpers                                                                              |
| `request(method, path, options?)`           | Generic verb                                                                                    |
| `upload(path, options?)`                    | Multipart + progress — not on the core `tanstack-fetch` client (use `/sse`, `/live`, providers) |
| `sse(path, options?)`                       | From `tanstack-fetch/sse` or `/live`                                                            |
| `ws(path, options?)`                        | WebSocket — only from `tanstack-fetch/live` ([guide](/guide/websocket))                         |
| `transport(path, options?)`                 | WebTransport (HTTP/3 datagrams) — only from `tanstack-fetch/live`                               |
| `stream(path, options?)`                    | NDJSON `AsyncIterable` — only from `tanstack-fetch/live`                                        |
| `use(name, interceptor)`                    | Register interceptor                                                                            |
| `eject(name)`                               | Remove interceptor                                                                              |

## Request options

| Option               | Notes                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `params`             | Typed from path (`:id` / `{id}`), required when placeholders exist. Only the pathname is scanned — ports and `?query` colons are ignored |
| `query`              | Query string                                                                                                                             |
| `body`               | Objects → JSON; `string`, `FormData`, `Blob`, `URLSearchParams`, `ArrayBuffer`, typed arrays and `ReadableStream` are sent as-is         |
| `headers`            | Per-request headers                                                                                                                      |
| `signal`             | AbortSignal (pass Query’s)                                                                                                               |
| `timeoutMs`          | Override client timeout (default 30 000). Rejects with `TimeoutError` — see `isAbortError`                                               |
| `parseAs`            | `json` \| `text` \| `blob`                                                                                                               |
| `operation`          | Name for interceptor match                                                                                                               |
| `interceptors`       | Per-request `use` / `eject`                                                                                                              |
| `onUploadProgress`   | Browser upload progress (XHR) — ignored by core `tanstack-fetch`; use `/sse` / `/live`                                                   |
| `onDownloadProgress` | Browser download progress (XHR) — ignored by core `tanstack-fetch`; use `/sse` / `/live`                                                 |
