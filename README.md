# tanstack-fetch

**The fetch client that speaks `queryFn`.** Returns data. Throws typed errors. Respects `AbortSignal`.

> Independent project — not an official TanStack package and not affiliated with the TanStack maintainers.

SSR · SSE · React · Vue/Nuxt · Solid · Angular · Svelte · tRPC · DevTools

[![npm version](https://img.shields.io/npm/v/tanstack-fetch.svg)](https://www.npmjs.com/package/tanstack-fetch)
[![npm downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fmohamadgarmabi.github.io%2Ftanstack-fetch%2Fbadges%2Ftanstack-fetch-dm.json&cacheSeconds=3600)](https://www.npmjs.com/package/tanstack-fetch)
[![bundle size](https://img.shields.io/bundlephobia/minzip/tanstack-fetch)](https://bundlephobia.com/package/tanstack-fetch)
[![license](https://img.shields.io/npm/l/tanstack-fetch.svg)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/mohamadgarmabi/tanstack-fetch/ci.yml?branch=main&label=CI)](https://github.com/mohamadgarmabi/tanstack-fetch/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/mohamadgarmabi/tanstack-fetch?style=social)](https://github.com/mohamadgarmabi/tanstack-fetch)

<p align="center">
  <img src="https://raw.githubusercontent.com/mohamadgarmabi/tanstack-fetch/main/.github/assets/tanstack-fetch-demo.gif" alt="tanstack-fetch: typed status handlers firing for 200, 401, 404, 429 and 503" width="690">
</p>

<p align="center"><a href="https://mohamadgarmabi.github.io/tanstack-fetch/examples/playground">▶ Try it in the playground</a></p>

## Docs

**→ [mohamadgarmabi.github.io/tanstack-fetch](https://mohamadgarmabi.github.io/tanstack-fetch/)**

Guides, API, playground, Vue/Nuxt, SSR, SSE, upload, tRPC, DevTools, [API mocking](https://mohamadgarmabi.github.io/tanstack-fetch/guide/mocking), and comparison live on the site.

## Install

```bash
npm install tanstack-fetch @tanstack/react-query
# Vue / Nuxt
npm install tanstack-fetch vue
```

```ts
import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

## Entry points

| Import                    | Use                                                      |       gzip |
| ------------------------- | -------------------------------------------------------- | ---------: |
| `tanstack-fetch`          | Slim HTTP (add features via `interceptors`)              | **3.97KB** |
| `tanstack-fetch/sse`      | Full HTTP (shortcuts, `upload()`) + `api.sse()`          | **6.96KB** |
| `tanstack-fetch/full`     | Alias of `/sse` for when you only need the full HTTP API |       same |
| `tanstack-fetch/live`     | HTTP + `api.sse()` / `ws()` / `transport()` / `stream()` | **9.40KB** |
| `tanstack-fetch/plugins`  | Interceptor factories                                    | **1.26KB** |
| `tanstack-fetch/react`    | `FetchProvider`, `useFetch`, `useSse`, `useWs`           | **1.02KB** |
| `tanstack-fetch/vue`      | `createFetchPlugin`, `useFetch`, `useSse`, `useWs`       | **1.04KB** |
| `tanstack-fetch/solid`    | `FetchProvider`, `useFetch`, `useSse`, `useWs`           |   optional |
| `tanstack-fetch/svelte`   | `setFetchClient`, `useFetch`, `useSse`, `useWs`          |   optional |
| `tanstack-fetch/angular`  | `provideFetchClient`, `injectFetch`, `useSse`, `useWs`   |   optional |
| `tanstack-fetch/trpc`     | tRPC link                                                | **3.80KB** |
| `tanstack-fetch/devtools` | Request dock                                             | **9.08KB** |
| `tanstack-fetch/mock`     | `createMocks()` for HTTP / SSE / NDJSON / WS mocks       | **1.82KB** |

Minified ESM, `gzip` measured locally after `npm run build` (`npm run size`).

The core takes auth, status handlers and plugins as interceptors from `tanstack-fetch/plugins`. Option shortcuts (`getToken`, `onUnauthorized`, `plugins: [...]`), `upload()` and progress events live on `tanstack-fetch/sse` / `/live` and the framework providers:

```ts
import { createFetch } from 'tanstack-fetch'
import { createAuthInterceptor, createStatusInterceptor } from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({ 401: () => logout() }),
  ],
})
```

HTTP and network failures throw `FetchError`. A cancelled `signal` or an elapsed `timeoutMs` rejects with the platform `AbortError` / `TimeoutError` instead — check those with `isAbortError(error)` ([Errors guide](https://mohamadgarmabi.github.io/tanstack-fetch/guide/errors)).

## Compared to axios / ky / ofetch

| Need                               | tanstack-fetch                       | axios                      | ky                                   | ofetch                             |
| ---------------------------------- | ------------------------------------ | -------------------------- | ------------------------------------ | ---------------------------------- |
| Use as a TanStack Query `queryFn`  | Returns data, throws, takes `signal` | Return `response.data`     | Call `.json()`                       | Works directly                     |
| Typed error with status / body     | `FetchError` (`.status` / `.data`)   | `AxiosError` (`.response`) | `HTTPError` (`.response`)            | `FetchError` (`.status` / `.data`) |
| Per-status handlers (401, 403, …)  | `createStatusInterceptor` map        | Response interceptor       | `afterResponse` hook                 | `onResponseError` hook             |
| Refresh token, one refresh at once | Built-in interceptor                 | Write it in an interceptor | Write it in a hook                   | Write it in a hook                 |
| SSR cookie forwarding              | `ssr-forward` plugin                 | Pass headers yourself      | Pass headers yourself                | Pass headers yourself              |
| SSE with `Authorization`           | `api.sse()` (`/sse`)                 | Not built in               | Not built in                         | Not built in                       |
| Upload progress                    | `api.upload()` (`/sse`, `/live`)     | `onUploadProgress`         | `onUploadProgress` (recent versions) | Not built in                       |
| tRPC transport                     | `tanstack-fetch/trpc`                | Not built in               | Not built in                         | Not built in                       |

**When to use what:** already happy with axios interceptors, or need Node streams and proxies? Keep axios. Want the smallest wrapper over `fetch` with retries? ky is great. On Nuxt, `$fetch` (ofetch) is built in and drops into `queryFn` as is. Reach for tanstack-fetch when you want Query-shaped calls, auth / refresh / SSR cookies and SSE or WebSocket from one client.

Full write-up: [Comparison](https://mohamadgarmabi.github.io/tanstack-fetch/guide/comparison)

## Try it

- [Playground](https://mohamadgarmabi.github.io/tanstack-fetch/examples/playground)
- [StackBlitz examples](./examples)
- [Migrate from axios / ky / ofetch / fetch](https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate)
- [Doctor CLI](https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate#doctor) — `npx tanstack-fetch doctor`
- [What's new — 2.2.1](https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-2-2-1)
- [Changelog](./CHANGELOG.md)

## Support

If tanstack-fetch saves you time, a ⭐ on [GitHub](https://github.com/mohamadgarmabi/tanstack-fetch) helps other developers find it. Issues, ideas and PRs are welcome.

## License

[MIT](./LICENSE) · [Mohammad Garmabi](https://github.com/mohamadgarmabi)
