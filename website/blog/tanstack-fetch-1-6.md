---
title: 'tanstack-fetch 1.6.1: path params that stay typed'
description: Required URL params from :id / {id}, response generics via curry, and a simpler API without throwOnError or route maps.
---

# tanstack-fetch 1.6.1: path params that stay typed

<p class="blog-meta">October 1, 2026</p>

![tanstack-fetch 1.6.1: path params that stay typed](/images/blog-1-6-1-cover.jpg)

`1.6.0` shipped an experimental route map (`createFetch<Routes>()`) so response types and URL `params` could be inferred together. That worked, but it asked every app to maintain a central type map.

`1.6.1` keeps the useful part — **strict `params` from the path** — and drops the map.

## What stays simple

Placeholders in the path make `params` required and keyed from the URL:

```ts
await api.get('/users/:id', { params: { id } })
await api.get('/users/:id', { params: {} }) // ❌ Property 'id' is missing
await api.get('/users/:id') // ❌ params required
```

No `createFetch<Routes>()`. No extra types file. The string you pass is the source of truth.

## Response generics: curry once

TypeScript cannot partially infer generics. If you write `api.get<User>(path, options)`, the path falls back to `string` and the `params` check goes soft.

So response typing uses an empty call:

```ts
type User = { id: string; name: string }

await api.get<User>()('/users/:id', { params: { id } })
await api.get<User>()('/users/:id', { params: {} }) // ❌ missing id
```

Same idea for `post` / `put` / `patch` / `delete` / `upload` / `request`.

## Breaking changes

| Change | Migration |
| ------ | --------- |
| `throwOnError` removed | Always get data or a thrown `FetchError` (Query style) |
| `createFetch<Routes>()` removed | Use path literals + `api.get<T>()(…)` when you need both |
| `api.get<T>(path, …)` | Become `api.get<T>()(path, …)` |

## Upgrade

```bash
npm install tanstack-fetch@1.6.1
```

## Docs

- [Path-typed params](/api/create-fetch#path-typed-params)
- [Getting started](/guide/getting-started)
- [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)
