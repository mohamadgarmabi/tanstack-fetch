---
title: 'tanstack-fetch 1.6.3: migrate from axios, ky, ofetch, or fetch'
titleTemplate: false
description: CLI that scans axios, ky, ofetch, $fetch, and fetch call sites, applies safe rewrites for TanStack Query, and scaffolds React, Vue, Nuxt, or Next.js.
---

# tanstack-fetch 1.6.3: migrate from axios, ky, ofetch, or fetch

<p class="blog-meta">October 7, 2026</p>

![tanstack-fetch 1.6.3: migrate](/images/blog-1-6-3-cover.jpg)

If you use TanStack Query, your `queryFn` already wants three things:

1. **Return data** (not a Response wrapper)
2. **Throw on failure** (so `isError` / `error` work)
3. **Honor `AbortSignal`**

Most HTTP clients need adapters for that shape. **`tanstack-fetch migrate`** scans axios / ky / ofetch / `$fetch` / raw fetch, applies safe rewrites, and optionally scaffolds your framework.

Full reference: [Migrate guide](/guide/migrate).

## Upgrade

```bash
npm install tanstack-fetch@1.6.3
```

## Before → after

```ts
// before — axios
queryFn: async ({ signal }) => {
  const res = await axios.get('/users', { signal, params: { page: 1 } })
  return res.data
}

// after
queryFn: ({ signal }) =>
  api.get<User[]>('/users', { signal, query: { page: 1 } })
```

```ts
// before — Nuxt $fetch
await $fetch('/users')
await $fetch('/users', { method: 'POST', body: { name: 'Ada' } })

// after
await api.get('/users')
await api.post('/users', { body: { name: 'Ada' } })
```

One client. Data in, `FetchError` out, `signal` first-class.

## CLI

```bash
# Dry run
npx tanstack-fetch migrate --from axios --dir ./src
npx tanstack-fetch migrate --from all --dir ./src

# Apply + framework scaffold
npx tanstack-fetch migrate --from axios --framework react --dir ./src --write
npx tanstack-fetch migrate --from ofetch --framework nuxt --write
npx tanstack-fetch migrate --from fetch --framework nextjs --write
```

| Flag | Meaning |
| --- | --- |
| `--from` | `axios` \| `ky` \| `ofetch` \| `fetch` \| `all` |
| `--framework` | `react` \| `vue` \| `nuxt` \| `nextjs` |
| `--provider` / `--no-provider` | React: include / skip `FetchProvider` (interactive default: **no**) |
| `--write` | Apply safe transforms + write scaffold |
| `--no-scaffold` | Skip scaffold files (honored with `--framework` too) |

`--write` is conservative: safe patterns rewrite; interceptors and odd edge cases stay in the report.

Alias: `npx tanstack-fetch migrate-axios` → `--from axios`.

## What it rewrites

| From | To |
| --- | --- |
| `axios.create({ baseURL })` | `createFetch({ baseUrl })` |
| `axios('/users')` / `axios.get` | `api.get` |
| axios `params` / ky `searchParams` | `query` |
| `(await axios.get(…)).data` / `.json()` | data returned directly |
| `$fetch(url)` / `ofetch(url, { method })` | `api.get` / `api.post` / … |
| `isAxiosError` / ofetch `FetchError` | `isFetchError` / `FetchError` |

Also covered: `import * as axios`, `require('axios')`, instance clients after `create` / `ky.create`, `void fetch` / `.then` chains (report-first for raw fetch), `axios.defaults` (manual finding).

## Framework scaffolds

| Framework | Files |
| --- | --- |
| `react` | `src/lib/api.ts`, `src/queries/users.ts` (+ optional provider) |
| `vue` | `api.ts` + plugin |
| `nuxt` | `lib/api.ts`, plugin, `composables/useApi.ts` |
| `nextjs` | client `api.ts` + `api.server.ts` (`ssr-forward` + cookies) |

For React, `--write` asks whether to include `FetchProvider` (default **no**). Prefer `{ client: api }` for `useSse`. Skip the prompt with `--no-provider` or `--provider`.

## Safer scan defaults

- Symlink / cycle-safe walk; skip huge files; ignore `out` / `.cache` / `vendor` / …
- `baseURL` / `prefixUrl` only inside `createFetch({ … })`
- Only flag `res.ok` / `response.ok` (not unrelated `.ok`)
- Reject `--scaffold` paths outside the project root

## Try it

```bash
npx tanstack-fetch migrate --from all --dir ./src
npx tanstack-fetch migrate --from all --framework react --write --no-provider
```

See also: [Migrate](/guide/migrate) · [Comparison](/guide/comparison) · [Getting started](/guide/getting-started)
