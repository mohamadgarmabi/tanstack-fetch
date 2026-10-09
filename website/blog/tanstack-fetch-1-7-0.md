---
title: 'tanstack-fetch 1.7.0: doctor CLI + Solid, Angular, Svelte adapters'
titleTemplate: false
description: Health-check with tanstack-fetch doctor, real Solid/Angular/Svelte adapters, migrate scaffolds, and a docs Framework picker.
---

# tanstack-fetch 1.7.0: doctor CLI + Solid, Angular, Svelte adapters

<p class="blog-meta">October 9, 2026</p>

![tanstack-fetch 1.7.0](/images/blog-1-7-0-cover.jpg)

`createFetch` was always framework-agnostic. **1.7.0** ships real adapters for Solid, Angular, and Svelte — plus a health-check CLI and a docs Framework picker.

## Upgrade

```bash
npm install tanstack-fetch@1.7.0
```

## New adapters

| Import | API |
| --- | --- |
| `tanstack-fetch/solid` | `FetchProvider`, `useFetch`, `useSse` |
| `tanstack-fetch/svelte` | `setFetchClient`, `useFetch`, `useSse` |
| `tanstack-fetch/angular` | `provideFetchClient`, `injectFetch`, `useSse` (signals) |

Same SSE status model as React/Vue: `connecting` | `connected` | `disconnected` | `error`. Guides: [Solid](/guide/solid) · [Angular](/guide/angular) · [Svelte](/guide/svelte).

## Doctor

```bash
npx tanstack-fetch doctor --dir ./src
# alias
npx tanstack-fetch --doctor --dir ./src
```

Checks package.json (tanstack-fetch, legacy axios/ky/ofetch, detected frameworks), counts `createFetch` call sites, flags leftover legacy imports, and warns when a `queryFn` looks like it skips `AbortSignal`.

## New migrate frameworks

```bash
npx tanstack-fetch migrate --from axios --framework solid --write
npx tanstack-fetch migrate --from axios --framework angular --write
npx tanstack-fetch migrate --from fetch --framework svelte --write
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
```

| Framework | Query adapter | Notes |
| --- | --- | --- |
| `solid` | `@tanstack/solid-query` | `api.ts` + query options |
| `angular` | `@tanstack/angular-query-experimental` | `src/app/api.ts` |
| `svelte` | `@tanstack/svelte-query` | `src/lib/api.ts` |
| `sveltekit` | `@tanstack/svelte-query` | + `api.server.ts` with `ssr-forward` |

## Docs Framework picker

In the site header, choose a stack (default **All**). Multi-framework pages (SSE, tRPC, examples) hide sections that do not match. Preference is stored in `localStorage`.

## Try it

```bash
npx tanstack-fetch doctor --dir ./src
npx tanstack-fetch migrate --from all --framework solid --write
```

See also: [Migrate](/guide/migrate) · [SSE](/guide/sse) · [Changelog](https://github.com/mohamadgarmabi/tanstack-fetch/blob/main/CHANGELOG.md)
