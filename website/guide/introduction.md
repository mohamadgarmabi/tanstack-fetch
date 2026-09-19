# What is tanstack-fetch?

**tanstack-fetch** (by [Mohammad Garmabi](/author)) is a tiny, typed Fetch client shaped for [@tanstack/react-query](https://tanstack.com/query).

It is **not** an official TanStack package — it matches the same mental model Query expects from a `queryFn`:

1. **Return data** on success
2. **Throw** on HTTP failure (`FetchError`)
3. **Honor `AbortSignal`** so cancel / unmount is clean

![Mental model](/images/docs-mental-model.png)

## Who it’s for

- Apps already on TanStack Query that want a smaller alternative to axios / ky
- Next.js / TanStack Start apps that need SSR cookie forwarding
- Teams that want SSE with `Authorization` (not `EventSource`)
- tRPC users who want one shared auth/plugin client

## Entry points

![Entry points](/images/docs-entry-points.png)

| Import                   | What you get                         | Typical gzip |
| ------------------------ | ------------------------------------ | ------------ |
| `tanstack-fetch`         | HTTP (`get` / `post` / `upload` / …) | **~3.5KB**   |
| `tanstack-fetch/sse`     | + `api.sse()`                        | **~4.7KB**   |
| `tanstack-fetch/plugins` | plugin factories                     | **~0.9KB**   |
| `tanstack-fetch/react`   | `FetchProvider` / hooks              | **~1KB**     |
| `tanstack-fetch/trpc`    | tRPC link via `createFetch`          | **~3.1KB**   |

```ts
import { createFetch } from 'tanstack-fetch' // HTTP only
import { createFetch } from 'tanstack-fetch/sse' // + streams
```

## Next

- [Getting started](./getting-started)
- [Why this API?](./why)
- [TanStack Query recipes](./tanstack-query)
