# Entry points

| Import                    | What you get                                                  | gzip     |
| ------------------------- | ------------------------------------------------------------- | -------- |
| `tanstack-fetch`          | HTTP (`get` / `post` / `put` / `patch` / `delete` / `upload`) | 4.81KB   |
| `tanstack-fetch/sse`      | Same + `api.sse()`                                            | 5.94KB   |
| `tanstack-fetch/plugins`  | Plugin / interceptor factories                                | 1.13KB   |
| `tanstack-fetch/react`    | `FetchProvider`, `useFetch`, `useSse`                         | 0.81KB   |
| `tanstack-fetch/vue`      | `createFetchPlugin`, `useFetch`, `useSse`                     | 0.78KB   |
| `tanstack-fetch/trpc`     | `createTRPCFetchClient`                                       | 3.16KB   |
| `tanstack-fetch/devtools` | Request dock                                                  | 8.32KB   |

Prefer `tanstack-fetch` until you need streams; then switch the import to `tanstack-fetch/sse` (same `createFetch` API).
