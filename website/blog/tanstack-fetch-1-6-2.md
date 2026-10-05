---
title: 'tanstack-fetch 1.6.2: migrate from axios, ky, ofetch, or fetch'
titleTemplate: false
description: CLI that scans HTTP call sites, applies safe rewrites for TanStack Query, and scaffolds React, Vue, Nuxt, or Next.js.
---

# tanstack-fetch 1.6.2: migrate from axios, ky, ofetch, or fetch

<p class="blog-meta">October 5, 2026</p>

![Migrate axios, ky, ofetch, or fetch to tanstack-fetch](/images/blog-1-6-2-cover.jpg)

If you use TanStack Query, your `queryFn` already wants three things:

1. **Return data** (not a Response wrapper)
2. **Throw on failure** (so `isError` / `error` work)
3. **Honor `AbortSignal`**

Most HTTP clients need adapters for that shape. **1.6.2** ships a migrate CLI: scan axios / ky / ofetch / raw fetch, apply safe rewrites, and optionally scaffold your framework.

Full reference: [Migrate guide](/guide/migrate).

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

One client. Data in, `FetchError` out, `signal` first-class.

## CLI

```bash
npm install tanstack-fetch

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

`--write` is conservative: safe patterns are rewritten; query-param naming, interceptors, and manual `res.ok` are **reported** for review.

Alias: `npx tanstack-fetch migrate-axios` → `--from axios`.

## Mapping

| From | To |
| --- | --- |
| `axios.create({ baseURL })` | `createFetch({ baseUrl })` |
| `res.data` / `.json()` | `api.get` returns data |
| axios `params` / ky `searchParams` | `query` |
| `isAxiosError` | `isFetchError` |

Raw `fetch` is report-first — the CLI flags `fetch(`, `res.ok`, and `.json()` so you replace whole blocks deliberately.

## Framework scaffolds

| Framework | Files |
| --- | --- |
| `react` | `src/lib/api.ts`, `src/queries/users.ts` (+ optional provider) |
| `vue` | `api.ts` + plugin |
| `nuxt` | `lib/api.ts`, plugin, `composables/useApi.ts` |
| `nextjs` | client `api.ts` + `api.server.ts` (`ssr-forward` + cookies) |

For React, `--write` asks whether to include `FetchProvider` (default **no**). Prefer importing `api` into queryFns and passing `{ client: api }` to `useSse`. Skip the prompt with `--no-provider` or `--provider`.

## Try it

```bash
npx tanstack-fetch migrate --from all --dir ./src
npx tanstack-fetch migrate --from all --framework react --write --no-provider
```

See also: [Migrate](/guide/migrate) · [Comparison](/guide/comparison) · [Getting started](/guide/getting-started)
