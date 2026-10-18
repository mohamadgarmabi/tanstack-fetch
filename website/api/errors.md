---
title: Error API
description: FetchError and isFetchError API reference for tanstack-fetch.
---

# Error API

![FetchError shape](/images/docs-errors.png)

```ts
import { createFetchError, isFetchError, isAbortError } from 'tanstack-fetch'
```

## `FetchError`

| Field     | Meaning                                          |
| --------- | ------------------------------------------------ |
| `status`  | HTTP status (0 for network)                      |
| `code`    | Machine-readable code when available             |
| `message` | Human message                                    |
| `body`    | Parsed error body (raw text when not valid JSON) |
| `headers` | Response headers when present                    |

## Guards

- `isFetchError(error)` — narrow thrown HTTP / transport errors
- `isAbortError(error)` — aborted signals (`AbortError`) and `timeoutMs` timeouts (`TimeoutError`)

Timeouts and aborts are **not** `FetchError`s and do not run `onRequestError` interceptors.

## Codes

| `code`            | When                                                 |
| ----------------- | ---------------------------------------------------- |
| from body         | Non-2xx response whose JSON body has a string `code` |
| `HTTP_ERROR`      | Any other non-2xx response (incl. non-JSON bodies)   |
| `PARSE_ERROR`     | 2xx response with an invalid JSON body               |
| `NETWORK_ERROR`   | Connection failed (`status: 0`)                      |
| `RETRY_EXHAUSTED` | Interceptors kept asking to retry past `maxRetries`  |
