# Error API

```ts
import { createFetchError, isFetchError, isAbortError } from 'tanstack-fetch'
```

## `FetchError`

| Field | Meaning |
| --- | --- |
| `status` | HTTP status (0 for network) |
| `code` | Machine-readable code when available |
| `message` | Human message |
| `body` | Parsed error body |
| `headers` | Response headers when present |

## Guards

- `isFetchError(error)` — narrow thrown HTTP / transport errors  
- `isAbortError(error)` — aborted / timed out signals  
