# React API

```ts
import { FetchProvider, useFetch, useSse } from 'tanstack-fetch/react'
```

| Export                  | Role                                |
| ----------------------- | ----------------------------------- |
| `FetchProvider`         | Share client / config via context   |
| `useFetch()`            | Read the client                     |
| `useSse(path, options)` | React SSE helper (needs SSE client) |
