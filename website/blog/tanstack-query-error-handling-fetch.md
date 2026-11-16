---
title: 'TanStack Query Error Handling with fetch: Typed 4xx and 5xx Errors'
titleTemplate: false
description: 'TanStack Query error handling with fetch: why fetch never throws on 404 or 500, typed errors with Register, global toasts, error boundaries, form errors and retry rules.'
date: 2026-11-16
category: Tutorials
tags: ['TanStack Query', 'Errors', 'TypeScript', 'React']
keyword: 'tanstack query error handling'
---

# TanStack Query Error Handling with fetch

<p class="blog-meta">November 16, 2026 · TanStack Query · fetch · TypeScript</p>

> **TL;DR:** `fetch` resolves on 404 and 500, so TanStack Query only sees an error if your `queryFn` throws one. Throw a typed error that carries `status`, `code` and `body`, register it as Query's `defaultError`, and then handle it in exactly one place per concern: toasts in `QueryCache.onError`, page-level failures in an error boundary, form errors in `useMutation`, and retry decisions in `retry`. Aborts are not errors to show.

Most "TanStack Query error handling" bugs are not Query bugs. They come from the layer under it: the function you hand to `queryFn`. This post walks through that layer first, then through the four places Query lets you react to an error, with copy-pasteable TypeScript for each. The examples use React, but every `QueryClient` option shown here exists in the Vue, Solid, Svelte and Angular adapters too.

tanstack-fetch, used in some examples below, is an independent open-source HTTP client by Mohammad Garmabi. It is not an official TanStack package. Everything in this post also works with your own small wrapper; the point is the shape of the error, not the library.

## Why does TanStack Query not show an error for a 404 or 500?

Because `fetch` only rejects when no response arrives at all (DNS failure, CORS, offline). A `404 Not Found` or a `500` is still a response, so the promise resolves, `response.json()` parses the error body, and Query happily caches it as **data**:

```ts
// ❌ A 500 here becomes cached "data": { message: 'Internal error' }
useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then((res) => res.json()),
})
```

TanStack Query's contract is simple: a `queryFn` returns data or throws. It never inspects the value you return. So the first fix is always in the `queryFn`:

```ts
async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return (await res.json()) as T
}

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => getJson<User[]>('/api/users', signal),
})
```

That works, but look at what got lost: the status code is now buried in a string, the server's error body (often `{ code: 'EMAIL_TAKEN', message: '…' }`) is gone, and if you ever parse the body before checking `res.ok`, a `502` HTML page from a proxy turns into a confusing `SyntaxError` instead of an HTTP error. Every later step in this post depends on keeping that information.

## What should a fetch error carry?

Four fields cover nearly every UI decision:

| Field     | Used for                                                                |
| --------- | ----------------------------------------------------------------------- |
| `status`  | Branching: 401 → login, 404 → empty state, 429 → wait, 5xx → retry       |
| `code`    | Machine-readable reason from the body, e.g. `EMAIL_TAKEN`               |
| `body`    | Field-level validation errors for forms                                 |
| `headers` | `Retry-After` on 429/503, request IDs for support tickets               |

Plus one convention: **`status: 0` means no response** (network failure), so you can tell "the server said no" apart from "the server was unreachable".

You can build this yourself in about 30 lines. tanstack-fetch ships it as [`FetchError`](/api/errors): every non-2xx response rejects with `status`, `code` (from the body, else `HTTP_ERROR`), `message`, `body` and `headers`. A non-JSON error page keeps its real status with the raw text in `body`, a 2xx with broken JSON becomes `PARSE_ERROR`, and a dropped connection becomes `NETWORK_ERROR` with `status: 0`.

```ts
// src/api.ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({ baseUrl: import.meta.env.VITE_API_URL })

// in a component
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

No `!res.ok`, no `.json()`, and the `signal` still reaches the request, so Query can [cancel it](/guide/tanstack-query) when the key changes.

## How do I type the error in useQuery?

In TanStack Query v5 the `error` field is typed as `Error` by default. If every `queryFn` in the app throws the same error type, tell Query once with module augmentation instead of passing a generic on every hook:

```ts
// src/query-types.d.ts
import '@tanstack/react-query'
import type { FetchError } from 'tanstack-fetch'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: FetchError
  }
}
```

Now `error.status` and `error.code` autocomplete everywhere, in `useQuery`, `useMutation`, `QueryCache.onError` and `retry`.

Be honest with yourself about one thing before you do this: `Register` is a promise you make to the compiler, not a runtime check. If a `queryFn` can also throw something else, such as a Zod `ZodError` from response validation, keep the default `Error` type and narrow at the use site with a type guard:

```ts
import { isFetchError } from 'tanstack-fetch'

const { error } = useQuery({ queryKey: ['user', id], queryFn: ({ signal }) => api.get<User>(`/users/${id}`, { signal }) })

if (isFetchError(error) && error.status === 404) return <UserNotFound />
if (error) return <ErrorPanel error={error} />
```

`isFetchError` checks the error's `name`, `status` and `code` rather than `instanceof`, so it keeps working across bundles, iframes and SSR boundaries.

## Where should global error toasts go?

Into `QueryCache.onError` and `MutationCache.onError`, not into your HTTP client's interceptors.

The reason is retries. TanStack Query retries a failed query three times by default in the browser. HTTP-level interceptors run on **every attempt**, so a toast fired from an interceptor can appear up to four times for one failure. The cache callbacks run **once**, after the query has finally failed:

```ts
// src/query-client.ts
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import { toast } from './toast'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Background refetch of data the user can already see: stay quiet.
      if (query.state.data !== undefined) return
      const custom = query.meta?.errorMessage
      toast.error(typeof custom === 'string' ? custom : describe(error))
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      // Mutations with their own onError handle their own UI.
      if (mutation.options.onError) return
      toast.error(describe(error))
    },
  }),
})

function describe(error: Error): string {
  if (!isFetchError(error)) return 'Something went wrong'
  if (error.status === 0) return 'You appear to be offline'
  if (error.status === 403) return 'You do not have access to this'
  if (error.status === 429) return 'Too many requests, try again shortly'
  if (error.status >= 500) return 'The server had a problem, try again'
  return error.message
}
```

Set a friendlier message per query with `meta`:

```ts
useQuery({
  queryKey: ['invoices'],
  queryFn: ({ signal }) => api.get<Invoice[]>('/invoices', { signal }),
  meta: { errorMessage: 'Could not load invoices' },
})
```

Interceptors still have a job: **side effects that must happen on the first failed attempt**, regardless of Query. Redirecting to login on 401 is the classic one, because retrying an unauthenticated request three times is pointless. tanstack-fetch's [`createStatusInterceptor`](/guide/configuration) is built for that, and the [refresh-token recipe](/recipes/refresh-token) covers the case where a 401 should trigger a single refresh instead of a logout:

```ts
import { createFetch } from 'tanstack-fetch'
import { createStatusInterceptor } from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [
    createStatusInterceptor({
      401: () => {
        window.location.href = '/login'
      },
    }),
  ],
})
```

Rule of thumb: **navigation and auth in the interceptor, messages in the cache callbacks.** Never both for the same status, or users get a redirect and a toast at once.

## When should a query throw to an error boundary?

Use an error boundary when the page cannot render anything useful without the data: a detail page whose resource failed, or a dashboard whose main query is down. Use the inline `error` state when the failure is local: one widget, one list among many.

`throwOnError` takes a function, so you can send only some errors to the boundary. A common split is "server broke → boundary, client mistake → inline":

```tsx
import { QueryErrorResetBoundary, useSuspenseQuery } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { isFetchError } from 'tanstack-fetch'

// Non-suspense hook: choose per error
useQuery({
  queryKey: ['project', id],
  queryFn: ({ signal }) => api.get<Project>(`/projects/${id}`, { signal }),
  throwOnError: (error) => !isFetchError(error) || error.status >= 500,
})

// Suspense pages: errors always go to the nearest boundary
export function ProjectPage({ id }: { id: string }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div role="alert">
              <p>{isFetchError(error) ? error.message : 'Unexpected error'}</p>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          <ProjectDetails id={id} />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function ProjectDetails({ id }: { id: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ['project', id],
    queryFn: ({ signal }) => api.get<Project>(`/projects/${id}`, { signal }),
  })
  return <h1>{data.name}</h1>
}
```

`QueryErrorResetBoundary` matters: without `reset`, the "Try again" button re-renders the boundary but the query is still in its error state and throws again immediately.

## How do I show server validation errors from a mutation?

Mutations are where `code` and `body` pay off. Suppose the API answers a failed sign-up with `422` and `{ "code": "VALIDATION_ERROR", "message": "Invalid input", "fields": { "email": "Already registered" } }`. Because `body` is `unknown`, write a small guard for the shape your backend actually sends, then map it onto the form:

```ts
import { useMutation } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'
import type { NoParams } from 'tanstack-fetch'

type SignUpInput = { email: string; password: string }
type FieldErrors = Partial<Record<keyof SignUpInput, string>>

const hasFieldErrors = (body: unknown): body is { fields: FieldErrors } =>
  typeof body === 'object' && body !== null && 'fields' in body &&
  typeof (body as { fields: unknown }).fields === 'object'

export function useSignUp(setFieldError: (field: keyof SignUpInput, message: string) => void) {
  return useMutation({
    mutationFn: (input: SignUpInput) =>
      api.post<{ id: string }, NoParams, SignUpInput>('/users', { body: input }),
    onError: (error) => {
      if (isFetchError(error) && error.status === 422 && hasFieldErrors(error.body)) {
        for (const [field, message] of Object.entries(error.body.fields)) {
          if (message) setFieldError(field as keyof SignUpInput, message)
        }
        return
      }
      if (isFetchError(error) && error.code === 'EMAIL_TAKEN') {
        setFieldError('email', error.message)
      }
    },
  })
}
```

Because this mutation has its own `onError`, the global `MutationCache.onError` above skips it, so the user sees the inline field error and no duplicate toast.

## Which errors should TanStack Query retry?

Retrying a `400`, `403`, `404` or `422` sends the same bad request again and gets the same answer, three more times, while the user stares at a spinner. Retry only what can change: network failures, `408`, `429` and `5xx`.

```ts
import { QueryClient } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false
        if (!isFetchError(error)) return false // bugs in your code: fail fast
        return error.status === 0 || RETRYABLE.has(error.status)
      },
    },
  },
})
```

For `429`, the server usually tells you how long to wait. `parseRetryAfter(error.headers)` turns a `Retry-After` header into milliseconds you can feed to `retryDelay`; the [rate-limit recipe](/recipes/rate-limit) has the full version. If retries stop when you do not expect them to, the cause is usually outside this function, and the [TanStack Query retry troubleshooting post](/blog/tanstack-query-retry-not-working-fix) walks through those cases.

## Are aborted requests errors?

Not ones you should show. When a query key changes or a component unmounts, TanStack Query aborts the `signal` it gave your `queryFn`, and it treats the resulting rejection as a cancellation: the query goes back to its previous state instead of `error`. That only works if the `signal` actually reaches `fetch`, which is why every example above passes `{ signal }`.

Timeouts are different. A request that hits its timeout is a real failure the user should hear about. In tanstack-fetch both arrive as non-`FetchError` values, and `isAbortError` tells them apart from HTTP failures:

```ts
import { isAbortError, isFetchError } from 'tanstack-fetch'

try {
  await api.post('/reports/export', { timeoutMs: 10_000 })
} catch (error) {
  if (isAbortError(error)) {
    if (error instanceof Error && error.name === 'TimeoutError') toast.error('Export timed out')
    return // a user cancel needs no message
  }
  if (isFetchError(error)) toast.error(error.message)
}
```

## How do raw fetch, axios and tanstack-fetch compare for error handling?

| Concern                          | Raw `fetch`                     | axios                                      | tanstack-fetch                         |
| -------------------------------- | ------------------------------- | ------------------------------------------ | -------------------------------------- |
| Throws on 4xx/5xx                | No, check `res.ok` yourself     | Yes (`validateStatus` to change)           | Yes                                    |
| Status on the error              | Only if you add it              | `error.response?.status`                   | `error.status`                         |
| Server error body                | Only if you add it              | `error.response?.data`                     | `error.body`, `error.code`             |
| Network failure vs HTTP failure  | `TypeError` vs your own error   | `error.response === undefined`             | `status: 0`, `code: 'NETWORK_ERROR'`   |
| Non-JSON error page (502 HTML)   | `SyntaxError` if parsed first   | Raw string in `data`                       | Real status, raw text in `body`        |
| Type guard                       | Write your own                  | `axios.isAxiosError`                       | `isFetchError`, `isAbortError`         |
| Query `signal` cancellation      | Pass `{ signal }`               | Pass `{ signal }`                          | Pass `{ signal }`                      |

axios handles errors well and is a reasonable choice if it is already in your app; the main friction with Query is the extra `.data` unwrap and reading everything through `error.response`. A hand-rolled wrapper around `fetch` is fine for a few endpoints. A dedicated client earns its place when many screens need the same status, code and body handling. If you are weighing that switch, the [comparison guide](/guide/comparison) and the [React axios walkthrough](/blog/react-axios-tanstack-fetch) go deeper, and [Migrate](/guide/migrate) covers moving call sites.

## Checklist

1. Every `queryFn` throws on non-2xx and passes `signal`.
2. The thrown error carries `status`, `code`, `body` and `headers`; `status: 0` means offline.
3. `Register.defaultError` is set only if every `queryFn` throws that type.
4. Toasts live in `QueryCache.onError` / `MutationCache.onError`, which run once after retries.
5. Auth redirects live in an HTTP interceptor; never toast and redirect for the same status.
6. `throwOnError` sends only unrecoverable errors to a boundary wrapped in `QueryErrorResetBoundary`.
7. `retry` skips 4xx except 408 and 429.
8. Aborts are ignored; timeouts are reported.

## Frequently asked questions

### Does TanStack Query catch errors from fetch automatically?

It catches anything your `queryFn` throws or rejects with. It does not inspect HTTP status codes, so a `fetch` call that resolves with a 404 or 500 is treated as success unless you throw.

### Why does onError not exist on useQuery in v5?

TanStack Query v5 removed `onError`, `onSuccess` and `onSettled` from `useQuery` because they ran once per component using the query. Use `QueryCache.onError` for global side effects, or read `error` in render for local UI. `useMutation` still has `onError`.

### How do I get the HTTP status code from a TanStack Query error?

Throw an error object that carries it. With tanstack-fetch, narrow with `isFetchError(error)` and read `error.status`. With axios, read `error.response?.status`. With raw `fetch`, add the status to your own error class before throwing.

### Should I retry 401 responses?

No. Either refresh the token once and replay the request (see the [refresh-token recipe](/recipes/refresh-token)) or send the user to log in. Retrying with the same expired token only adds load.

## Related

- [Errors guide](/guide/errors): status handlers and examples
- [Error API reference](/api/errors): every `FetchError` field and code
- [TanStack Query integration](/guide/tanstack-query): `signal`, query keys and adapters
- [Configuration](/guide/configuration): `onUnauthorized`, `onForbidden` and status shortcuts
- [Mock your API](/blog/mock-api-http-sse-websocket-tanstack-fetch): simulate 4xx, 5xx and network failures without a broken backend
