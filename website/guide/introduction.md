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

| Import                   | What you get                         | gzip     |
| ------------------------ | ------------------------------------ | -------- |
| `tanstack-fetch`         | HTTP (`get` / `post` / `upload` / …) | **4.81KB** |
| `tanstack-fetch/sse`     | + `api.sse()`                        | **5.94KB** |
| `tanstack-fetch/plugins` | plugin factories                     | **1.13KB** |
| `tanstack-fetch/react`   | `FetchProvider` / hooks              | **0.81KB** |
| `tanstack-fetch/vue`     | plugin / composables (Vue 3 / Nuxt)  | **0.78KB** |
| `tanstack-fetch/trpc`    | tRPC link via `createFetch`          | **3.16KB** |
| `tanstack-fetch/devtools`| request dock                         | **8.32KB** |

```ts
import { createFetch } from 'tanstack-fetch' // HTTP only
import { createFetch } from 'tanstack-fetch/sse' // + streams
```

## Next

- [Getting started](./getting-started)
- [Agent skill](./skill) — `npx skills add mohamadgarmabi/tanstack-fetch --skill tanstack-fetch`
- [Why this API?](./why)
- [TanStack Query recipes](./tanstack-query)
