# Migrate from axios to tanstack-fetch – checklist

![Migrate from axios to tanstack-fetch – checklist](/images/page-guide-migrate-checklist.jpg)

Use this checklist after the CLI scan (`npx tanstack-fetch migrate --from axios`) to verify and complete the migration.

## 0. Pre-flight

- [ ] Ensure `tanstack-fetch` is installed: `npm install tanstack-fetch`
- [ ] Run health-check: `npx tanstack-fetch doctor --dir ./src`
  - Identify leftover axios imports
  - Confirm signal pass-through in queryFn call sites

## 1. What the CLI automates (safe rewrites)

- [ ] `axios.create({ baseURL })` → `createFetch({ baseUrl })`
- [ ] `params` → `query`
- [ ] Raw `fetch(` + `res.ok` / `.json()` → `api.get/post...()`
- [ ] `isAxiosError` → `isFetchError`
- [ ] Common `await axios(url).then(r => r.data)` → `await api.get(url)`

## 2. Manual review points

| File                | Check                                      | Expected?                                                                       | Notes                                                                             |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/lib/api.ts`    | Axios adapters missing?                    | **No axios adapter if you use `createFetch`**                                   | Compare: `onFulfilled` interceptor chains, retry logic.                           |
| `src/queryFns/*.ts` | `signal` passed?                           | `api.get(url, { signal })`                                                      | If missing, rewrite to pass `{ signal }`.                                         |
| `src/queries/...ts` | `api` used?                                | Return data, throw `FetchError`                                                 | Ensure `useQuery` receives `{ signal }` from React Query.                         |
| `src/**/*.ts`       | `axios.defaults` references?               | **Remove** defaults, move to `createFetch` config                               | Re-apply globally to `api` via `getToken`, `onUnauthorized`, etc.                 |
| `src/**/*.ts`       | `try/catch` around `axios`?                | **Simplify**: let `FetchError` bubble to Query error state                      | Only wrap if you need transformation of the error shape.                          |
| `src/**/*.ts`       | `fetch` + `res.ok`?                        | Already covered by CLI, but review                                              | `--from axios --write` only rewrites axios-specific patterns.                     |
| `src/**/*.ts`       | Manual `Authorization` header?             | Use `createFetch({ getToken })`                                                 | Avoid setting header manually on each request.                                    |
| `src/**/*.ts`       | `HTTPError` (axios) used?                  | Import `isFetchError`                                                           | Same error-narrowing, only different name.                                        |
| `src/**/*.ts`       | `axios.interceptors.request` / `response`? | Consolidate with `plugins` (`refresh-token`, `sse-resume`, `auth` interceptors) | `plugins: ['refresh-token']`; custom interceptors go in `guide/configuration.md`. |

## 3. Adapter replacements (when you need axios behavior)

| Axios feature                                    | tanstack-fetch equivalent                                                              | Where to document        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------ |
| `axios.interceptors.request.use`                 | `createFetch({ plugins: ['trace'] })` + custom `HttpInterceptor` (guide/configuration) | `guide/plugins.md`       |
| `axios.interceptors.response.use`                | `onUnauthorized` / `onForbidden` handlers + `onResponseError`                          | `guide/configuration.md` |
| `axios.interceptors.request.eject`               | `api.eject('my-interceptor')`                                                          | `guide/plugins.md`       |
| `axios.request` or `axios({ ... })` (raw config) | Use `api.request('/path', { method, body, headers, signal })`                          | `guide/configuration.md` |
| `axios.toFormData` (custom)                      | Use native `FormData` + `api.upload` or custom `interceptors`                          | `guide/upload.md`        |
| `axios.getURI` (query params)                    | `{ query: { ... } }` (same shape as `params`)                                          | `guide/configuration.md` |

## 4. Framework scaffold wiring

If the CLI wrote scaffold files (e.g., `src/lib/api.ts`, `src/queries/users.ts`):

- [ ] Import `api` into every queryFn.
- [ ] Ensure React Query receives `{ signal }` from `queryFn`'s `{ signal }` argument.
- [ ] For Vue/Nuxt/Solid/Angular/Svelte: wire `useFetch` / `useSse` as shown in framework guides.
- [ ] Run the dev server; inspect devtools/network for `401` → retry; confirm no duplicate refresh calls.
- [ ] Verify that `AbortSignal` cancellation works on unmount (React Query, other frameworks).

## 5. Test verification

| Test                     | How to run                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------- |
| No duplicate 401 refresh | Open network tab → trigger parallel requests → expect **one** `/auth/refresh` call |
| Signal cancellation      | Rapid unmount + abort; ensure inflight requests abort                              |
| Error shape              | Query error `isFetchError` should expose `status`, `code`, `body`                  |
| Type safety              | tsc passes; check generic `T` in `api.get<T>`                                      |
| ssr cookies (Next/Nuxt)  | Prefetch on server → confirm cookie forwarding (`ssr-forward`)                     |
| SSE reconnect            | Stream -> network offline -> resume; `Last-Event-ID` handling                      |

## 6. Rollback strategy

- Keep a branch with `axios` for a short window.
- If you used `--write`, you can restore original files from git (e.g., `git checkout -- src`). The CLI records safe transforms; manual overrides are easier to revert.

## 7. Post-migration follow-ups

1. Review the doctor report after removing all axios references: `npx tanstack-fetch doctor --dir ./src`
2. Update any documentation (README, README.md, tutorials) to mention `tanstack-fetch` and the axios-to-tanstack-fetch migration path.
3. Update the project’s migration blog entry (e.g., `/blog/react-axios-tanstack-fetch`) with updated CLI or known edge cases.

## 8. Quick migration cheat-sheet

```ts
// OLD (axios)
queryFn: async ({ signal }) => {
  const res = await axios.get('/users', { signal, params: { page: 1 } })
  return res.data
}

// NEW (tanstack-fetch)
queryFn: ({ signal }) => api.get<User[]>('/users', { signal, query: { page: 1 } })
```

**Do NOT copy-paste blindly** – verify `{ signal }` is passed (not wrapped in a local variable that loses the argument).

## References

- `guide/configuration.md` – interceptors / plugins
- `guide/plugins.md` – built-in `refresh-token` + custom interceptors
- `guide/ssr.md` – ssr-forward cookies for Next/Nuxt
- `guide/why.md` – why `createFetch` matches Query better than axios
- `guide/tanstack-query.md` – wiring with Query
- `guide/migrate` – CLI flags (`--framework`, `--write`)
- `recipes/refresh-token.md` – single-flight 401 refresh
- `examples/nextjs-fetch-tanstack-fetch.md` – Next.js SSR cookie scenario
