# Entry points

Measured gzip for **tanstack-fetch@2.1.0** (minified ESM, `npm run size`).

| Import                    | What you get                                             | gzip   |
| ------------------------- | -------------------------------------------------------- | ------ |
| `tanstack-fetch`          | Slim HTTP (`get` / `post` / `put` / `patch` / `delete`)  | 3.97KB |
| `tanstack-fetch/sse`      | Full HTTP (shortcuts, `upload`) + `api.sse()`            | 6.96KB |
| `tanstack-fetch/full`     | Alias of `/sse`                                          |   same |
| `tanstack-fetch/live`     | Same + `api.sse()` / `ws()` / `transport()` / `stream()` | 9.40KB |
| `tanstack-fetch/plugins`  | Plugin / interceptor factories                           | 1.26KB |
| `tanstack-fetch/react`    | `FetchProvider`, `useFetch`, `useSse`, `useWs`           | 1.02KB |
| `tanstack-fetch/vue`      | `createFetchPlugin`, `useFetch`, `useSse`, `useWs`       | 1.04KB |
| `tanstack-fetch/trpc`     | `createTRPCFetchClient`                                  | 3.80KB |
| `tanstack-fetch/devtools` | Request dock (`setupDevtools`)                           | 9.08KB |
| `tanstack-fetch/mock`     | API mocks (`createMocks`)                                | 1.82KB |

Prefer `tanstack-fetch` until you need streams; then switch the import to `tanstack-fetch/sse` for SSE only, or `tanstack-fetch/live` for SSE + WebSocket + WebTransport + NDJSON (same `createFetch` API).

`useFetch` (React / Vue) injects the shared client — it does not perform HTTP. In Nuxt, alias as `useFetchClient`.
