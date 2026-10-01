# Entry points

| Import                   | What you get                                                  | Typical gzip |
| ------------------------ | ------------------------------------------------------------- | ------------ |
| `tanstack-fetch`         | HTTP (`get` / `post` / `put` / `patch` / `delete` / `upload`) | ~3.5KB       |
| `tanstack-fetch/sse`     | Same + `api.sse()`                                            | ~4.7KB       |
| `tanstack-fetch/plugins` | Plugin / interceptor factories                                | ~0.9KB       |
| `tanstack-fetch/react`   | `FetchProvider`, `useFetch`, `useSse`                         | ~1KB         |
| `tanstack-fetch/vue`     | `createFetchPlugin`, `useFetch`, `useSse`                     | ~0.8KB       |
| `tanstack-fetch/trpc`    | `createTRPCFetchClient`                                       | ~3.1KB       |

Peers: `@tanstack/react-query` or `@tanstack/vue-query` (typical), `yaml` only for OpenAPI CLI, React only for `/react`, Vue only for `/vue`.
