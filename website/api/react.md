# React API

```ts
import { FetchProvider, useFetch, useSse } from 'tanstack-fetch/react'
```

| Export                  | Role                                |
| ----------------------- | ----------------------------------- |
| `FetchProvider`         | Share client / config via context   |
| `useFetch()`            | Read the client                     |
| `useSse(path, options)` | React SSE helper (needs SSE client) |

### `useSse` result

| Field    | Type                                                       |
| -------- | ---------------------------------------------------------- |
| `data`   | Last message payload                                       |
| `event`  | Last full SSE event                                        |
| `error`  | Last error                                                 |
| `status` | `'connecting' \| 'connected' \| 'disconnected' \| 'error'` |
| `close`  | Stop the stream                                            |
