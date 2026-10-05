---
title: Migrate from axios, ky, ofetch, or fetch
description: CLI and call-site mapping to replace axios, ky, ofetch, or raw fetch with tanstack-fetch for TanStack Query.
---

# Migrate to tanstack-fetch

tanstack-fetch matches TanStack Query: **return data**, **throw `FetchError`**, **honor `AbortSignal`**.

## CLI

```bash
npm install tanstack-fetch

# Scan (dry run)
npx tanstack-fetch migrate --from axios --dir ./src
npx tanstack-fetch migrate --from ky --dir ./src
npx tanstack-fetch migrate --from ofetch --dir ./src
npx tanstack-fetch migrate --from fetch --dir ./src
npx tanstack-fetch migrate --from all --dir ./src

# Apply safe transforms + framework scaffold
npx tanstack-fetch migrate --from axios --framework react --dir ./src --write
npx tanstack-fetch migrate --from axios --framework vue --write
npx tanstack-fetch migrate --from ofetch --framework nuxt --write
npx tanstack-fetch migrate --from fetch --framework nextjs --write
npx tanstack-fetch migrate-axios --framework react --write
```

| Flag | Meaning |
| --- | --- |
| `--from` | `axios` \| `ky` \| `ofetch` \| `fetch` \| `all` |
| `--framework` | `react` \| `vue` \| `nuxt` \| `nextjs` — scaffold provider/plugin/SSR files |
| `--dir` | Root to scan (default `.`) |
| `--write` | Apply safe transforms (+ scaffold) |
| `--scaffold` | Custom path for generic `api.ts` (ignored when `--framework` is set) |
| `--no-scaffold` | Skip creating scaffold files |

`--write` never fully rewrites every edge case. Always review **query params**, **interceptors**, and **manual `res.ok` / `.json()`** findings.

---

## From axios

| axios | tanstack-fetch |
| --- | --- |
| `axios.create({ baseURL })` | `createFetch({ baseUrl })` |
| `await axios.get(url)` → `response.data` | `await api.get(url)` |
| `params: { page }` (query string) | `query: { page }` |
| `isAxiosError` / `AxiosError` | `isFetchError` / `FetchError` |

```ts
// before
queryFn: async ({ signal }) => {
  const response = await axios.get('/users', { signal, params: { page: 1 } })
  return response.data
}

// after
queryFn: ({ signal }) => api.get<User[]>('/users', { signal, query: { page: 1 } })
```

---

## From ky

| ky | tanstack-fetch |
| --- | --- |
| `ky.create({ prefixUrl })` | `createFetch({ baseUrl })` |
| `await ky.get(url).json()` | `await api.get(url)` |
| `searchParams` | `query` |
| `HTTPError` | `FetchError` / `isFetchError` |

```ts
// before
const data = await ky.get('users', { searchParams: { page: 1 } }).json()

// after
const data = await api.get<User[]>('/users', { query: { page: 1 } })
```

---

## From ofetch / $fetch

| ofetch | tanstack-fetch |
| --- | --- |
| `ofetch.create({ baseURL })` | `createFetch({ baseUrl })` |
| `$fetch(url)` / `ofetch(url, { method })` | `api.get` / `api.post` / … |
| `query` | `query` (same) |
| ofetch `FetchError` | tanstack-fetch `FetchError` / `isFetchError` |

```ts
// before
const users = await $fetch('/users', { query: { page: 1 } })

// after
const users = await api.get<User[]>('/users', { query: { page: 1 } })
```

Nuxt tip: keep Nuxt’s `$fetch` for Nitro routes if you want; use a shared `createFetch` client for your app API + Query.

---

## From raw `fetch`

| fetch | tanstack-fetch |
| --- | --- |
| `fetch(url)` + `res.ok` + `res.json()` | `api.get(url)` |
| Manual `Authorization` header | `getToken` on `createFetch` |
| Manual timeout / abort | `{ signal }` / `timeoutMs` |

```ts
// before
queryFn: async ({ signal }) => {
  const res = await fetch('/users', { signal })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// after
queryFn: ({ signal }) => api.get<User[]>('/users', { signal })
```

Raw fetch migration is **report-first**: the CLI flags `fetch(`, `res.ok`, and `.json()`; it does not rewrite whole try/catch blocks automatically.

---

## Framework scaffolds (`--framework`)

With `--write --framework <name>` the CLI writes ready-to-wire files:

| Framework | Files |
| --- | --- |
| `react` | `src/lib/api.ts`, `src/queries/users.ts` (+ optional `src/lib/fetch-provider.tsx`) |
| `vue` | `src/lib/api.ts`, `src/plugins/tanstack-fetch.ts`, `src/queries/users.ts` |
| `nuxt` | `lib/api.ts`, `plugins/tanstack-fetch.ts`, `composables/useApi.ts`, `queries/users.ts` |
| `nextjs` | `src/lib/api.ts`, `src/lib/api.server.ts` (cookies + `ssr-forward`), `src/lib/fetch-provider.tsx`, `src/queries/users.ts` |

### React

Default scaffold is **without** `FetchProvider` — import `api` into queryFns (and pass `{ client: api }` to `useSse`).

With `--write --framework react` the CLI asks:

```text
Use FetchProvider for React? [y/N]
```

- Enter / `N` (default) → `api.ts` + `queries/users.ts`
- `y` → also writes `src/lib/fetch-provider.tsx`

Skip the prompt with `--no-provider` (default) or `--provider`.

```tsx
import { api } from './lib/api'
import { usersQueryOptions } from './queries/users'
import { useQuery } from '@tanstack/react-query'

const Users = () => {
  const { data } = useQuery(usersQueryOptions)
  return <pre>{JSON.stringify(data)}</pre>
}
```

Optional provider wrap (when you answered `y` / passed `--provider`):

```tsx
import AppFetchProvider from './lib/fetch-provider'

export default () => (
  <AppFetchProvider>
    <Users />
  </AppFetchProvider>
)
```

### Vue

```ts
import { createApp } from 'vue'
import { installTanstackFetch } from './plugins/tanstack-fetch'
import App from './App.vue'

const app = createApp(App)
installTanstackFetch(app)
app.mount('#app')
```

### Nuxt

Install the generated plugin. Prefer:

```ts
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'
// or composables/useApi.ts from the scaffold
```

Do **not** confuse with Nuxt core `useFetch` — ours only injects the shared client.

### Next.js

- Client: `src/lib/api.ts` + optional `FetchProvider`
- Server Components / Route Handlers: `const api = await createServerApi()` from `api.server.ts`

Without `--framework`, `--write` still creates a generic `src/lib/api.ts`.

## Related

- [React](/guide/react)
- [Vue & Nuxt](/guide/vue)
- [SSR](/guide/ssr)
- [Comparison](/guide/comparison)
- [Why this API?](/guide/why)
- [TanStack Query](/guide/tanstack-query)
- [Refresh token](/recipes/refresh-token)
- [OpenAPI CLI](/guide/openapi)
