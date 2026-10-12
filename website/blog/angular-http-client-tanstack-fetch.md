---
title: 'Angular HttpClient vs tanstack-fetch: typed fetch for TanStack Angular Query'
titleTemplate: false
description: Replace Angular HttpClient glue with tanstack-fetch — provideFetchClient, injectFetch, signals SSE, Angular Query, refresh-token, migrate CLI, and a full side-by-side comparison.
---

# Angular HttpClient vs tanstack-fetch

<p class="blog-meta">October 12, 2026 · Angular · TanStack Query · HTTP</p>

::: tip Stack
**Angular 17+** · `tanstack-fetch/angular` · `@tanstack/angular-query-experimental`
:::

Angular’s `HttpClient` is excellent at transporting bytes. It is **not** shaped for TanStack Query’s `queryFn` contract: return data, throw on failure, honor `AbortSignal`.

That gap shows up as unwrap-`.data` helpers, RxJS subscriptions that fight Query’s cache, and interceptors that reinvent refresh-token single-flight. **tanstack-fetch** closes it with the same client every other stack already uses — wired through Angular DI and signals.

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when you should keep `HttpClient`.

## TL;DR

| If you need… | Prefer |
| --- | --- |
| Drop into `injectQuery` / `injectMutation` | **tanstack-fetch** |
| Typed `FetchError` with `status` + body | **tanstack-fetch** |
| SSE with `Authorization` + resume | **tanstack-fetch/sse** + `useSse` |
| Classic Angular apps with heavy RxJS pipes | `HttpClient` is fine |
| One HTTP client shared with React/Vue/Solid | **tanstack-fetch** |

```bash
npm install tanstack-fetch @tanstack/angular-query-experimental
```

## Mental model

`HttpClient` speaks **Observables**. TanStack Query speaks **Promises + AbortSignal**. Bridging them is possible — and noisy.

<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img" aria-label="Architecture: Angular UI to Query to tanstack-fetch to API">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Component</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">signals · template</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">Angular Query</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">injectQuery · cache</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#g1)" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">injectFetch() · createFetch</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">Angular DI: provideFetchClient → FETCH_CLIENT → injectFetch</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">HttpClient stays optional for legacy RxJS-heavy modules</text>
</svg>
</div>

**Contract that matters for Query:**

1. Success → return the parsed body (not `HttpResponse`)
2. HTTP failure → **throw** (so `isError` works)
3. Cancel / route change → pass Query’s `signal` through

`api.get<User[]>('/users', { signal })` does all three. `http.get(...).pipe(map(r => r.body))` asks you to remember them.

## Side-by-side: list users

### Angular HttpClient + Query (glue)

```ts
import { HttpClient } from '@angular/common/http'
import { inject } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { firstValueFrom } from 'rxjs'

export class UsersHttpComponent {
  private readonly http = inject(HttpClient)

  readonly users = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: async ({ signal }) => {
      // firstValueFrom + manual abort wiring
      const request = this.http.get<User[]>('/api/users')
      const sub = new AbortController()
      signal.addEventListener('abort', () => sub.abort())
      return firstValueFrom(request) // often forgets AbortSignal entirely
    },
  }))
}
```

Common cracks: forgetting `signal`, returning the whole `HttpResponse`, catching errors that Query should own.

### tanstack-fetch + Query (native)

```ts
import { Component } from '@angular/core'
import { injectFetch } from 'tanstack-fetch/angular'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { isFetchError } from 'tanstack-fetch'

@Component({
  selector: 'app-users',
  template: `
    @if (users.isPending()) {
      <p>Loading…</p>
    } @else if (users.isError()) {
      <p>{{ errorLabel() }}</p>
    } @else {
      <ul>
        @for (user of users.data(); track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
    }
  `,
})
export class UsersComponent {
  private readonly api = injectFetch()

  readonly users = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      this.api.get<User[]>('/users', { signal }),
  }))

  errorLabel = () => {
    const error = this.users.error()
    return isFetchError(error) ? `${error.status}: ${error.message}` : 'Error'
  }
}
```

No `.data` unwrap. Failures throw `FetchError`. Cancel is free if you forward `signal`.

## Bootstrap once with DI

```ts
import { bootstrapApplication } from '@angular/platform-browser'
import { provideHttpClient } from '@angular/common/http' // optional legacy
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'
import { createFetch } from 'tanstack-fetch'
import { provideFetchClient } from 'tanstack-fetch/angular'
import { AppComponent } from './app.component'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
})

bootstrapApplication(AppComponent, {
  providers: [
    provideFetchClient({ client: api }),
    provideTanStackQuery(new QueryClient()),
    // keep HttpClient only while migrating modules
    // provideHttpClient(),
  ],
})
```

`injectFetch()` reads the `FETCH_CLIENT` token. If you forget `provideFetchClient`, you get a clear error instead of a silent `undefined`.

You can also pass `{ client }` into `useSse` without DI — useful for SSE-only islands.

## Comparison graph: where glue accumulates

Rough relative **boilerplate** for the same features (lower is better). Not a benchmark — a map of where teams spend time.

<div class="blog-chart" role="img" aria-label="Boilerplate comparison chart">
  <div class="blog-chart-row">
    <span class="blog-chart-label">Query-ready GET</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 18%">tanstack-fetch</div>
      <div class="blog-chart-bar is-http" style="--w: 72%">HttpClient + firstValueFrom</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Typed HTTP errors</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 22%">FetchError</div>
      <div class="blog-chart-bar is-http" style="--w: 68%">HttpErrorResponse map</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">401 refresh + retry</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 28%">refresh-token plugin</div>
      <div class="blog-chart-bar is-http" style="--w: 90%">custom interceptor queue</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">SSE + Authorization</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 30%">useSse signals</div>
      <div class="blog-chart-bar is-http" style="--w: 95%">EventSource / custom</div>
    </div>
  </div>
  <div class="blog-chart-row">
    <span class="blog-chart-label">Shared with React/Vue</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: 20%">one createFetch</div>
      <div class="blog-chart-bar is-http" style="--w: 88%">rewrite per stack</div>
    </div>
  </div>
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">typical HttpClient path</span>
  </p>
</div>

## Feature matrix

| Capability | tanstack-fetch | Angular HttpClient |
| --- | --- | --- |
| Returns body for Query `queryFn` | Yes | Adapt (`firstValueFrom` + map) |
| Throws typed error with status/body | `FetchError` + `isFetchError` | `HttpErrorResponse` |
| Native `AbortSignal` | First-class | Manual / limited |
| Status handlers `401`–`429` | Built-in | Custom interceptor |
| Refresh token single-flight | Plugin | Custom |
| Path params typing `:id` | Yes | Manual |
| Upload + progress | `api.upload()` | Yes |
| SSE + `Authorization` | `tanstack-fetch/sse` | Not built-in |
| Angular signals SSE | `useSse` | DIY |
| tRPC transport | `tanstack-fetch/trpc` | DIY |
| RxJS operators / `HttpContext` | Via bridge | Native |
| Bundle (HTTP core) | ~4.8KB gzip | Framework-included |

## Auth, status handlers, refresh

```ts
import { createFetch } from 'tanstack-fetch'
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

let expiresAt = 0

const api = createFetch({
  baseUrl: '/api',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: async () => {
    // optional: redirect to login once refresh fails
  },
})

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{ accessToken: string; expiresIn: number }>(
        '/auth/refresh',
        { interceptors: { eject: ['refresh-token', 'auth'] } },
      )
      localStorage.setItem('access_token', body.accessToken)
      expiresAt = Date.now() + body.expiresIn * 1000
    },
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000,
    },
    after: { enabled: true },
  }),
)
```

HttpClient teams usually encode the same flow as a multi-file interceptor with a shared `BehaviorSubject` queue. The plugin keeps **one in-flight refresh** and retries the failed call.

## Mutations without ceremony

```ts
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental'
import { injectFetch } from 'tanstack-fetch/angular'

export class CreateUserComponent {
  private readonly api = injectFetch()
  private readonly queryClient = injectQueryClient()

  readonly createUser = injectMutation(() => ({
    mutationFn: (input: CreateUserInput) => this.api.post<User>('/users', { body: input }),
    onSuccess: () => {
      void this.queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  }))
}
```

## Live data: SSE as signals

Browser `EventSource` cannot set `Authorization`. `tanstack-fetch/sse` streams over `fetch`, so cookies or Bearer tokens work.

```ts
import { Component } from '@angular/core'
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/angular'

const live = createFetch({
  baseUrl: '/api',
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

@Component({
  selector: 'app-orders-live',
  template: `
    <p class="status">{{ status() }}</p>
    @if (error(); as err) {
      <p class="error">{{ err.message }}</p>
    }
    <pre>{{ data() | json }}</pre>
    <button type="button" (click)="close()">Stop</button>
  `,
})
export class OrdersLiveComponent {
  private readonly stream = useSse<OrderEvent>('/orders/stream', { client: live })
  readonly data = this.stream.data
  readonly status = this.stream.status
  readonly error = this.stream.error
  readonly close = this.stream.close
}
```

Status model matches React/Vue/Solid: `connecting` | `connected` | `disconnected` | `error`.

<div class="blog-flow" aria-hidden="true">
  <div class="blog-flow-step">connecting</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step is-accent">connected</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step">onMessage → data()</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step">close() / destroy</div>
</div>

`useSse` hooks `DestroyRef` so the stream closes when the component is destroyed.

## tRPC over the same client

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { injectFetch } from 'tanstack-fetch/angular'
import type { AppRouter } from './server'

export class PostsComponent {
  private readonly api = injectFetch()

  private readonly trpc = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        fetch: createTRPCFetch(this.api),
      }),
    ],
  })

  readonly posts = injectQuery(() => ({
    queryKey: ['posts'],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      this.trpc.post.list.query(undefined, { signal }),
  }))
}
```

Auth headers, refresh-token, and status handlers apply to tRPC the same way they apply to REST.

## Migrate from axios / HttpClient habits

```bash
# scaffold Angular + Query options from axios-shaped code
npx tanstack-fetch migrate --from axios --framework angular --write

# health check leftovers
npx tanstack-fetch doctor --dir ./src
```

`--framework angular` writes something like `src/app/api.ts` plus query-option helpers aimed at `@tanstack/angular-query-experimental`.

Suggested migration order:

1. Create one `createFetch` client + `provideFetchClient`
2. Move read paths into `injectQuery` first (highest Query win)
3. Port mutations
4. Replace custom 401 refresh with the plugin
5. Keep `HttpClient` only where RxJS pipelines are still the product

## Suggested folder layout

```text
src/app/
  api.ts                 # createFetch singleton
  app.config.ts          # provideFetchClient + provideTanStackQuery
  queries/
    users.query.ts       # queryOptions factories
  features/
    users/
      users.component.ts # injectFetch + injectQuery
    live/
      orders-live.component.ts  # useSse
```

```ts
// src/app/api.ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: '/api',
  getToken: () => localStorage.getItem('access_token'),
})
```

```ts
// src/app/queries/users.query.ts
import { queryOptions } from '@tanstack/angular-query-experimental'
import { api } from '../api'

export const usersQueryOptions = queryOptions({
  queryKey: ['users'] as const,
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
```

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query (or Angular Query) your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No, pure RxJS streams everywhere → <code>HttpClient</code> may stay</li>
      </ul>
    </li>
    <li><strong>Do you need SSE with Authorization or resume?</strong>
      <ul>
        <li>Yes → <code>tanstack-fetch/sse</code> + <code>useSse</code></li>
        <li>No → either client works for REST</li>
      </ul>
    </li>
    <li><strong>Do React / Vue / Solid share the same backend client?</strong>
      <ul>
        <li>Yes → one <code>createFetch</code> across packages</li>
        <li>No → still fine; Angular DI adapters are optional</li>
      </ul>
    </li>
    <li><strong>Huge existing interceptor stack with no Query plan?</strong>
      <ul>
        <li>Keep HttpClient for now; migrate reads gradually</li>
      </ul>
    </li>
  </ol>
</div>

## Checklist

- [ ] `provideFetchClient({ client: api })` in `app.config` / bootstrap
- [ ] Every `queryFn` / `mutationFn` forwards `{ signal }`
- [ ] Errors inspected with `isFetchError` when you need `status`
- [ ] Refresh via plugin instead of a one-off interceptor race
- [ ] SSE from `tanstack-fetch/sse` (not bare `EventSource`) when auth matters
- [ ] `npx tanstack-fetch doctor --dir ./src` clean before merge

## Try it

```bash
npm install tanstack-fetch @tanstack/angular-query-experimental
npx tanstack-fetch migrate --from axios --framework angular --write
npx tanstack-fetch doctor --dir ./src
```

## Related

- [Angular guide](/guide/angular)
- [SSE · Angular](/guide/sse#angular)
- [tRPC · Angular](/guide/trpc#angular)
- [Migrate CLI](/guide/migrate)
- [Comparison matrix](/guide/comparison)
- [1.7.0 release](/blog/tanstack-fetch-1-7-0) — adapters + doctor

## Series

Same deep-dive format for every stack:

- [React](/blog/react-axios-tanstack-fetch)
- [Vue](/blog/vue-ofetch-tanstack-fetch)
- [Next.js](/blog/nextjs-fetch-tanstack-fetch)
- [Nuxt](/blog/nuxt-ofetch-tanstack-fetch)
- [Solid](/blog/solid-fetch-tanstack-fetch)
- [TanStack Start / Router](/blog/tanstack-start-router-tanstack-fetch)
- [Svelte / SvelteKit](/blog/sveltekit-fetch-tanstack-fetch)
