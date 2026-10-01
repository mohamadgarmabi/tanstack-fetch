---
title: 'tanstack-fetch 1.6.2: typed params with a second generic'
description: Pass the path as the second type argument — api.get<User, '/users/:id'>(…) — so response and URL params stay typed without curry.
---

# tanstack-fetch 1.6.2: typed params with a second generic

<p class="blog-meta">October 1, 2026</p>

![tanstack-fetch 1.6.1: path params that stay typed](/images/blog-1-6-1-cover.jpg)

`1.6.1` used a curry call (`api.get<User>()(path)`) so path `params` stayed checked when you also wanted a response type. That works, but the empty `()` is easy to miss.

`1.6.2` replaces it with a **second type argument**: the path literal.

## The API

```ts
type User = { id: string; name: string }

// params from the URL — no response generic
await api.get('/users/:id', { params: { id } })
await api.get('/users/:id', { params: {} }) // ❌ missing id

// response + params — pass the path as the second type argument
await api.get<User, '/users/:id'>('/users/:id', { params: { id } })
await api.get<User, 'new/old/:id'>('new/old/:id', { params: {} }) // ❌ missing id

// no placeholders — one generic is enough
await api.get<User[]>('/users')
```

Same pattern for `post` / `put` / `patch` / `delete` / `upload` / `request`.

## Why two type args?

TypeScript cannot partially infer generics. If you only write `api.get<User>(path, options)`, the path becomes `string` and the `:id` check disappears. Naming the path in the type list keeps both.

## From 1.6.1

| Before (1.6.1) | After (1.6.2) |
| -------------- | ------------- |
| `api.get<User>()('/users/:id', …)` | `api.get<User, '/users/:id'>('/users/:id', …)` |

## Upgrade

```bash
npm install tanstack-fetch@1.6.2
```

## Docs

- [Path-typed params](/api/create-fetch#path-typed-params)
- [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)
