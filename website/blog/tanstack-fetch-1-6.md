---
title: tanstack-fetch 1.6 — Vue, Nuxt and Developer Tools Release
titleTemplate: false
description: 'Pass a params map as the second type argument — api.get<User, { id: number }>(…) — and optional body typing on post/put/patch.'
---

# tanstack-fetch 1.6.1: typed params beside your DTO

<p class="blog-meta">October 1, 2026</p>

![tanstack-fetch 1.6.1: path params that stay typed](/images/blog-1-6-1-cover.jpg)

`1.6.0` experimented with a route map on `createFetch<Routes>()`. That is gone.

`1.6.1` types URL `params` from `:id` / `{id}`, lets you pass a **params map** beside your response DTO, and optionally types `body` on write methods.

## The API

```ts
import type { NoParams } from 'tanstack-fetch'

type User = { id: string; name: string }
type Params = { id: number }

// params from the URL — no response generic
await api.get('/users/:id', { params: { id } })
await api.get('/users/:id') // ❌ missing id

// response only — options required (TS loses the path literal)
await api.get<User>('/users/:id') // ❌ missing options
await api.get<User[]>('/users', {})

// response + params map — path must include those keys as :id / {id}
await api.get<User, Params>('/users/:id', { params: { id } })
await api.get<User, Params>('/users/:id', { params: {} }) // ❌ missing id
await api.get<User, Params>('/users', { params: { id } }) // ❌ path has no :id
await api.get<User, { userId: number }>('/users/:id', { params: { userId: 1 } }) // ❌ no :userId

// post / put / patch — optional body type (third generic; use NoParams to skip params)
await api.post<User, NoParams, { name: string }>('/users', { body: { name: 'Ada' } })
await api.put<User, Params, { name: string }>('/users/:id', {
  params: { id },
  body: { name: 'Ada' },
})
```

Same pattern for `delete` / `upload`; body typing on `post` / `put` / `patch` / `request`.

## Why two (or three) type args?

TypeScript cannot partially infer generics. Writing only `api.get<User>(path)` turns the path into `string`, so `:id` checks disappear. Pass your params map as the second type argument (and body as the third on write methods) to keep both.

## From 1.6.0

| Before (1.6.0) | After (1.6.1) |
| -------------- | ------------- |
| `createFetch<Routes>()` route map | dropped — use path + params map |
| untyped / loose `params` | `api.get<User, { id: number }>('/users/:id', …)` |

## Upgrade

```bash
npm install tanstack-fetch@1.6.1
```

See also: [Getting started](/guide/getting-started), [createFetch](/api/create-fetch).
