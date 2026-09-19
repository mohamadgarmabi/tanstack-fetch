# tRPC helpers

![tRPC + createFetch](/images/docs-trpc.png)

```ts
import { createTRPCFetch, createTRPCFetchLink, createTRPCFetchClient } from 'tanstack-fetch/trpc'
```

| Helper                                          | Returns                                 |
| ----------------------------------------------- | --------------------------------------- |
| `createTRPCFetch(api \| options)`               | `typeof fetch` for links                |
| `createTRPCFetchLink({ url, client?, batch? })` | terminating link                        |
| `createTRPCFetchClient<AppRouter>(…)`           | `createTRPCClient` wired to createFetch |

Peers: `@trpc/client` (and `@trpc/server` types). Optional.
