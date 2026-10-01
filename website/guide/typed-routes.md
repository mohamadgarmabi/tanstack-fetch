# Typed routes

<Badge type="tip" text="since 1.6.0" />

Declare your API's response types once with `createFetch<Routes>()`. Every call then infers **both** the response type and the URL `params`, with no generic needed at the call site.

## The problem

Path placeholders (`:id` / `{id}`) make `params` required and typed:

```ts
await api.get('/users/:id', { params: { id: 1 } }) // ✅ params typed from the URL
await api.get('/users/:id', { params: { userId: 1 } }) // ❌ type error
```

As soon as you pass a response generic, the check disappears:

```ts
await api.get<User>('/users/:id', { params: { userId: 1 } }) // 😬 compiles
```

TypeScript has **no partial type-argument inference**. When you write one generic (`User`), every other generic takes its default, so the path becomes `string` and `params` falls back to a loose `Record`. No function signature can change this. The library has to know the response type **without** you passing it.

## The fix: a route map

```ts
// src/lib/api.ts
import { createFetch } from 'tanstack-fetch'

type User = { id: string; name: string }
type Post = { id: string; title: string }

type Routes = {
  '/users': User[]
  '/users/:id': User
  '/users/{id}/posts/{postId}': Post
  'POST /users': User // method-specific key
}

export const api = createFetch<Routes>({ baseUrl: import.meta.env.VITE_API_URL })
```

```ts
const user = await api.get('/users/:id', { params: { id: 1 } })
//    ^? User

const post = await api.get('/users/{id}/posts/{postId}', { params: { id: 1, postId: 2 } })
//    ^? Post

const created = await api.post('/users', { body: { name: 'Ada' } })
//    ^? User   ('POST /users' wins over '/users')

await api.get('/users/:id', { params: { userId: 1 } }) // ❌ wrong key
await api.get('/users/:id') // ❌ params required
```

Paths in the map also **autocomplete** in the `path` argument.

## Key rules

| Key                | Applies to                                    |
| ------------------ | --------------------------------------------- |
| `'/users/:id'`     | Every method                                  |
| `'GET /users/:id'` | Only `get` (and `request('GET', …)`)          |
| `'POST /users'`    | Only `post` / `upload` / `request('POST', …)` |

- The method-specific key wins over the bare path.
- A path missing from the map still works: the response is `unknown` and `params` is still typed from the URL.
- An explicit generic still wins: `api.get<Other>('/users/:id', …)` returns `Other`. Its params are loose, as before.
- `throwOnError: false` → `FetchResult<User>`.
- `type` and `interface` both work as the map.

## With TanStack Query

```ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '../lib/api'

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => api.get('/users/:id', { params: { id }, signal }),
    // data: User — inferred from the route map
  })
```

## SSE client

`createFetch<Routes>()` from `tanstack-fetch/sse` accepts the same map for its HTTP methods. `api.sse()` keeps its own `<T>` generic.

## Sharing the client

A typed client can be passed anywhere a plain client is expected, e.g. `<FetchProvider client={api}>`, `createFetchPlugin({ client: api })`, `useSse({ client: api })` and `createTRPCFetch({ client: api })`.
