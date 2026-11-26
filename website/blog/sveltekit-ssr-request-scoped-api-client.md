---
title: 'SvelteKit SSR: Keep User Cookies Out of Shared API Clients'
titleTemplate: false
description: 'Prevent cross-request cookie and token leaks in SvelteKit SSR. Build request-scoped tanstack-fetch clients, forward cookies safely, and keep browser clients separate.'
date: 2026-11-26
category: Tutorials
tags: ['SvelteKit', 'SSR', 'Security', 'TypeScript']
keyword: 'SvelteKit SSR authentication'
---

# SvelteKit SSR: Keep User Cookies Out of Shared API Clients

<p class="blog-meta">November 26, 2026 · SvelteKit · SSR · Security</p>

A bug in server-side rendering can be more serious than a failed API request: one visitor's authenticated request can accidentally reuse another visitor's credentials.

The risky pattern is familiar. Create an API client once at module scope, attach request cookies or an access token to it, and reuse it for every incoming request. That can work in a browser, where a tab belongs to one signed-in user. It is not a safe default on a Node.js server, where the same module instance can serve many users concurrently.

This guide shows how to structure a SvelteKit app with **one browser client and a fresh server client for each request**, using the current `tanstack-fetch` 2.2.1 API.

> tanstack-fetch is an independent open-source project. It is not an official TanStack package.

## The actual risk: server modules are shared

Imagine two requests arriving close together:

1. Alice requests `/account` with cookie `session=alice`.
2. Bob requests `/account` with cookie `session=bob`.
3. Both requests call a shared API client whose headers or mutable token state are changed per request.

If request-specific credentials are stored on that shared object, timing can decide which credentials are sent upstream. The result can be a cross-user data leak.

The rule is simple:

- **Browser:** a module-level client can be appropriate for the current browser session.
- **Server:** create the client inside the request or load operation and pass that request's credentials to it.
- **Never:** keep user cookies, authorization headers, or mutable per-request auth state in a server module singleton.

## 1. Keep the browser client separate

For browser components, create the client without capturing a server request. Read the browser token only when the code runs in the browser:

```ts
// src/lib/api.ts
import { browser } from '$app/environment'
import { PUBLIC_API_URL } from '$env/static/public'
import { createFetch } from 'tanstack-fetch'
import { createAuthInterceptor } from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: PUBLIC_API_URL,
  interceptors: [
    createAuthInterceptor({
      getToken: () =>
        browser && typeof localStorage !== 'undefined'
          ? localStorage.getItem('access_token')
          : null,
    }),
  ],
})
```

This client is intended for browser-side calls. The browser guard prevents server rendering from trying to read `localStorage`. Do not use this module-level client to forward a visitor's incoming server cookies.

## 2. Create a new API client for each server request

SvelteKit's `Cookies` object is request-scoped. Pass it into a factory and create a fresh client for that load or endpoint:

```ts
// src/lib/api.server.ts
import { PUBLIC_API_URL } from '$env/static/public'
import type { Cookies } from '@sveltejs/kit'
import { createFetch } from 'tanstack-fetch'
import {
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

export const createServerApi = (cookies: Cookies) =>
  createFetch({
    baseUrl: PUBLIC_API_URL,
    source: 'ssr',
    incoming: {
      cookie: cookies
        .getAll()
        .map(({ name, value }) => name + '=' + value)
        .join('; '),
    },
    interceptors: [
      createTraceInterceptor(),
      createSsrForwardInterceptor(),
    ],
  })
```

The important detail is not the helper name. It is where the client is created: **inside the factory call for the current request**. The cookie string is captured by that request's client, not written to shared module state.

The `ssr-forward` interceptor copies the incoming cookie header onto the outgoing server request. It skips browser-sourced requests. On the server, use an absolute API `baseUrl`, not a browser-relative path.

## 3. Use the factory in server load functions

Import the server-only module from a server load file:

```ts
// src/routes/account/+page.server.ts
import type { PageServerLoad } from './$types'
import { createServerApi } from '$lib/api.server'

type Account = {
  id: string
  email: string
}

export const load: PageServerLoad = async ({ cookies }) => {
  const api = createServerApi(cookies)
  const account = await api.get<Account>('/account')

  return { account }
}
```

Each invocation creates its own client with the cookies belonging to that request. The same factory can be used in a `+server.ts` endpoint by passing that endpoint's `event.cookies`.

Do not export a single `api` instance from `api.server.ts` if that instance contains request-specific cookies or headers. Export a factory instead.

## 4. Keep Svelte component context request-safe

The Svelte adapter has a separate job: making a client available to components through Svelte context.

In a root layout, configure the browser/component client with `setFetchClient`:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { api } from '$lib/api'
  import { setFetchClient } from 'tanstack-fetch/svelte'

  setFetchClient({ client: api })
</script>

<slot />
```

Then retrieve it inside a component:

```svelte
<script lang="ts">
  import { useFetch } from 'tanstack-fetch/svelte'
  import { createQuery } from '@tanstack/svelte-query'

  type Project = { id: string; name: string }

  const api = useFetch()
  const projects = createQuery({
    queryKey: ['projects'],
    queryFn: ({ signal }) => api.get<Project[]>('/projects', { signal }),
  })
</script>

{#if $projects.isPending}
  <p>Loading projects…</p>
{:else if $projects.isError}
  <p>Could not load projects.</p>
{:else}
  <ul>
    {#each $projects.data ?? [] as project (project.id)}
      <li>{project.name}</li>
    {/each}
  </ul>
{/if}
```

In SvelteKit server rendering, the adapter relies on component context rather than a module-level fallback. Since 2.2.1, its module fallback is browser-only: a server module is shared across requests, so storing one request's client there could expose its token or cookies to another request.

**Important:** `useFetch()` is for component context. In `+page.server.ts` and `+server.ts`, use the request-scoped `createServerApi(cookies)` factory instead.

## 5. What changed in tanstack-fetch 2.2.1?

Version 2.2.1 fixed a Svelte SSR isolation issue. The adapter no longer keeps a module-level fallback client on the server. On the server, the client is resolved from Svelte component context; the module fallback is used only in the browser.

That fix closes an unsafe fallback path inside the adapter. It does **not** make every application-level singleton safe. If your own server module exports a client that captures a user's cookies, authorization header, or mutable token, you can still create the same class of bug yourself.

The safe application pattern remains:

- Browser components: `setFetchClient` and `useFetch`.
- Server load functions: `createServerApi(cookies)` per request.
- No request-specific credentials in shared server module state.

## 6. Test isolation with two different users

A useful regression test should prove that concurrent requests do not share credentials.

At minimum, exercise the server API factory with two different cookie jars and assert that each outgoing request receives only its own cookie:

| Incoming request | Expected upstream cookie |
| --- | --- |
| Alice: `session=alice` | `session=alice` |
| Bob: `session=bob` | `session=bob` |

Run the requests concurrently as well as sequentially. A sequential test can miss a race that appears only when two requests overlap.

Also check that:

- A request without a session does not inherit a previous request's cookie.
- Browser code never reads `localStorage` during SSR.
- Server-only modules are imported only from server load files or server endpoints.
- Personalized HTML and data are not placed in a public shared cache.

## 7. Let the migration tool create the starting structure

The project includes a SvelteKit scaffold:

```bash
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
```

It creates a browser `src/lib/api.ts`, a server `src/lib/api.server.ts` using `ssr-forward` and cookies, and shared Query options. Review the generated files and keep the browser/server boundary intact when adapting them to your app.

## A safe SvelteKit SSR checklist

- [ ] Browser client does not capture incoming server cookies.
- [ ] Server API client is created per request.
- [ ] `incoming` credentials come from that request's `cookies` object.
- [ ] Server client uses an absolute API `baseUrl`.
- [ ] `createSsrForwardInterceptor()` is configured on the server client.
- [ ] Components use `setFetchClient` / `useFetch` through Svelte context.
- [ ] Server load functions use `createServerApi(cookies)`, not `useFetch()`.
- [ ] Concurrent requests with different users remain isolated.

For the broader framework setup, see the [Svelte & SvelteKit guide](/guide/svelte), the [SSR cookie-forwarding guide](/guide/ssr), and the [SvelteKit fetch comparison](/blog/sveltekit-fetch-tanstack-fetch).

---

**The takeaway:** a client can be reusable without being global. Reuse the factory and configuration; create a fresh authenticated client for each server request.
