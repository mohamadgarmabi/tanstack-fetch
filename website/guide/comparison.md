# Comparison

![Tree-shakeable entry points](/images/docs-entry-points.png)

| Need                               | tanstack-fetch                                    |
| ---------------------------------- | ------------------------------------------------- |
| Drop into TanStack Query `queryFn` | Returns data, throws `FetchError`, takes `signal` |
| Next.js SSR cookies                | `ssr-forward` plugin                              |
| Interceptors without axios weight  | Named, ordered, ejectable plugins                 |
| SSE with Authorization             | `tanstack-fetch/sse` (not `EventSource`)          |
| File upload + progress             | `api.upload()` + `onUploadProgress`               |
| tRPC transport                     | `tanstack-fetch/trpc`                             |
| Bundle                             | ~3.5KB gzip HTTP core                             |

Compared to **axios / ky / ofetch**: same mental model as Query, smaller core, SSR cookie forwarding, and SSE that can send `Authorization`.
