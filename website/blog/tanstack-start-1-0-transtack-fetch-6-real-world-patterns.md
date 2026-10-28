---
title: 'TanStack Start 1.0 + tanstack-fetch: 6 Real-World Data Fetching Patterns'
titleTemplate: false
description: 'TanStack Start 1.0 is here. Six production-ready patterns: direct fetching, shared loaders, SSR auth, mutations, centralized error handling, and live SSE updates with tanstack-fetch.'
date: 2026-10-12
category: Tutorials
tags: ["TanStack Start","Router","React","SSR","SSE"]
cover: /images/blog-tanstack-start-1-0-transtack-fetch-6-real-world-patterns-cover.jpg
---

# TanStack Start 1.0 + tanstack-fetch: 6 Real-World Data Fetching Patterns

TanStack Start is officially stable. If you have been waiting for the 1.0 release before building a production application, now is a good time to explore the framework.

But getting a full-stack React application running is only the first step. The more interesting engineering decisions come later:

- Where should an API request run: in a route loader, on the server, or in the browser?
- How do you avoid fetching the same data twice?
- How should server-side rendering handle cookies and authorization?
- How do mutations update the existing Query cache?
- What happens when an API returns an HTTP error?
- How can a page combine REST data with live server-sent events?

In this tutorial, we'll explore these scenarios using TanStack Start, TanStack Router, TanStack Query, and [tanstack-fetch](https://mohamadgarmabi.github.io/tanstack-fetch/).

## I'm the creator of tanstack-fetch, an HTTP client designed to work with TanStack Query's server-state model. It is an independent community package, not an official TanStack project.

## 1. Start with the right mental model

These libraries solve different problems:

- **TanStack Start** provides the full-stack application framework, including server rendering and server functions.
- **TanStack Router** coordinates routes, navigation, search parameters, and loaders.
- **TanStack Query** manages server-state caching, freshness, mutations, and background updates.
- **tanstack-fetch** handles HTTP requests, typed responses and errors, and reusable request behavior.

The important distinction is that an HTTP client and a server-state manager should not compete for the same responsibilities.

TanStack Query owns the cache. The HTTP client executes requests.

## 2. Pattern one: Fetch data directly

Not every request needs a complicated abstraction.

For a simple client-side request, create a reusable API client:

```ts
import { createFetch } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: '/api',
})
```

Then use it in a component or a query function:

```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '~/lib/api'

type User = {
  id: string
  name: string
}

export function Users() {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) =>
      api.get<User[]>('/users', { signal }),
  })

  if (usersQuery.isPending) {
    return <p>Loading users...</p>
  }

  if (usersQuery.isError) {
    return <p>Could not load users.</p>
  }

  return (
    <ul>
      {usersQuery.data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

Three details matter here:

1. The response is typed as `User[]`.
2. The query function passes Query's `AbortSignal` to the HTTP client.
3. HTTP failures should reject the query so Query can represent them through its error state.

Passing the signal also allows an obsolete request to be cancelled when appropriate.

**When to use this pattern:** Client-side widgets, independent requests, and pages that do not need route-level preloading.

## 3. Pattern two: Share route loaders and Query cache

This is where TanStack Router and TanStack Query become particularly useful together.

A common implementation fetches data in a loader, then makes another request when the component mounts. Another implementation stores loader data separately from Query's cache.

Instead, define reusable query options:

```ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '~/lib/api'

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  staleTime: 30_000,
})
```

Use the same options in the route loader and component:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { usersQueryOptions } from '~/queries/users'

export const Route = createFileRoute('/users')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(usersQueryOptions),
  component: UsersPage,
})

function UsersPage() {
  const { data: users } = useQuery(usersQueryOptions)

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

The router must expose the appropriate `queryClient` through its typed context, and the application must configure the Query provider and, when using SSR, the appropriate Router–Query integration.

The result is a shared contract:
- The loader can ensure that data is available before the route renders.
- The component reads from the same Query cache.
- Other components can reuse the same query options.
- Query controls freshness and subsequent refetching.

**When to use this pattern:** Lists, detail pages, nested routes, dashboards, and resources shared across multiple components.

## 4. Pattern three: Handle SSR and authenticated requests

Server-side rendering introduces a different problem: the server does not automatically inherit the browser's request context when it calls an external API.

If an upstream API requires the incoming request's cookies or authorization headers, the HTTP client needs an explicit server-side strategy.

`tanstack-fetch` supports an `ssr-forward` plugin for forwarding request context.

```ts
import { createFetch } from 'tanstack-fetch'

export const createServerApi = (
  apiOrigin: string,
  cookie: string | undefined,
) =>
  createFetch({
    baseUrl: `${apiOrigin}/api`,
    source: 'ssr',
    plugins: ['ssr-forward'],
    incoming: () => ({ cookie }),
  })
```

This example illustrates the configuration pattern. Obtain the cookie from the actual incoming request using the relevant TanStack Start server API, and create the client in the request's server-side execution context.

For a real application:
- Use an absolute API origin on the server.
- Read credentials from the incoming request, not from a global variable.
- Never expose private environment variables or server-only credentials to the browser.
- Avoid sharing user-specific API clients or Query caches across SSR requests.
- Forward only the headers that the upstream service actually needs.

**When to use this pattern:** Personalized SSR pages, authenticated dashboards, and applications whose API uses cookie-based sessions.

## 5. Pattern four: Mutations and cache invalidation

Fetching data is only half of a data layer. The other half is keeping the UI consistent after writes.

Suppose an application creates a user. The mutation should use the same HTTP client and invalidate the query that represents the user list.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '~/lib/api'

type CreateUserInput = {
  name: string
}

type User = {
  id: string
  name: string
}

export function CreateUserButton() {
  const queryClient = useQueryClient()

  const createUser = useMutation({
    mutationFn: (input: CreateUserInput) =>
      api.post<User>('/users', { body: input }),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['users'],
      }),
  })

  return (
    <button
      disabled={createUser.isPending}
      onClick={() => createUser.mutate({ name: 'New user' })}
    >
      {createUser.isPending ? 'Creating...' : 'Create user'}
    </button>
  )
}
```

The example assumes the application has already configured the appropriate Query provider.

Invalidation marks matching cached queries as stale and allows active queries to refetch according to Query's behavior. It does not blindly replace every cached copy of the data.

For more responsive interfaces, optimistic updates may be appropriate. However, they need a rollback strategy when the mutation fails and careful handling when concurrent updates are possible.

**When to use this pattern:** Forms, CRUD screens, admin panels, and any UI where a write affects previously fetched data.

## 6. Pattern five: Centralize HTTP errors and authentication behavior

HTTP errors should have predictable semantics across the application.

A `401 Unauthorized` response might indicate that a session has expired. A `403 Forbidden` response generally means that the caller is authenticated but lacks permission. A `404` means the resource was not found.

These conditions should not all trigger the same recovery action.

A reusable HTTP client gives you a place to configure error handling and interceptors instead of repeating that logic in every query function.

For example, a refresh-token interceptor can coordinate token refresh and retry eligible failed requests:

```ts
import { createFetch } from 'tanstack-fetch'
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: '/api',
})

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      // Refresh the session using your authentication flow.
      // Store updated credentials according to your
      // application's security model.
    },
  }),
)
```

The refresh implementation is application-specific. It must actually obtain and persist or update the new credential before a retry can succeed.

A production implementation should also consider:
- Concurrent requests that fail while a refresh is in progress.
- Refresh failure and session expiry.
- Avoiding recursive refresh requests.
- Which HTTP methods are safe to retry.
- Cross-tab session changes.
- Whether credentials are stored in secure, HttpOnly cookies or another appropriate mechanism.

**When to use this pattern:** Applications with authentication, protected APIs, consistent error handling, and several features that share the same backend.

## 7. Pattern six: Combine REST queries with live SSE updates

Some pages need both an initial snapshot and a stream of updates.

Examples include notifications, order tracking, live dashboards, and operational monitoring.

A useful architecture is:

1. Load the initial resource through REST or another regular API.
2. Use TanStack Query to cache and manage that resource.
3. Open a server-sent events connection in the browser.
4. Update the cache when an event arrives, or invalidate the relevant query when the event is incomplete.

tanstack-fetch provides SSE support through its `tanstack-fetch/sse` integration.

The exact event handling depends on the shape of your API. For a complete entity update, you may be able to update the cache directly:

```ts
queryClient.setQueryData(
  ['order', orderId],
  updatedOrder,
)
```

If the event only tells you that an order changed, invalidating the query is usually safer:

```ts
queryClient.invalidateQueries({
  queryKey: ['order', orderId],
})
```

An SSE reconnect does not prove that no events were missed. If you need reliable recovery, design the protocol around event IDs, replay or resume support, and a strategy for reconciling the current snapshot.

**When to use this pattern:** Live dashboards, event-driven interfaces, and pages where server state changes without a user action.

## 8. What about Server Functions?

TanStack Start Server Functions are useful for server-only logic that your own application invokes across the client/server boundary.

For example, they can wrap a database operation or access server-only environment variables.

They are not interchangeable with a generic HTTP client.

Use a Server Function when the operation belongs to the application's server logic. Use an HTTP client when communicating with a REST API or another HTTP service. Use Server Routes when you need endpoints intended to be called externally or across origins.

If you combine Server Functions with TanStack Query, keep validation, authorization, and cache invalidation explicit. The server boundary does not remove the need for security checks.

## 9. A practical project structure

One possible structure is:

```text
src/
  lib/
    api.ts
  queries/
    users.ts
    orders.ts
  routes/
    users.tsx
    orders.$orderId.tsx
  components/
    create-user-button.tsx
```

The exact folders are less important than keeping responsibilities clear:

- `lib/api.ts` owns reusable HTTP configuration.
- `queries/` owns shared query keys, options, and request functions.
- `routes/` owns navigation and route-level data requirements.
- `components/` owns UI behavior and presentation.

For SSR, keep request-specific clients and caches scoped to the request. Do not turn a convenience singleton into a cross-user data leak.

## 10. How should you choose?

| Requirement | Recommended approach |
| --- | --- | |
| Simple browser request | `createFetch` + `useQuery` |
| Route-level preloading | `queryOptions` + `ensureQueryData` |
| Authenticated SSR | Request-scoped client + `ssr-forward` |
| Writes and stale cached data | `useMutation` + invalidation |
| Shared HTTP error policy | Client configuration and plugins |
| Live server updates | SSE + Query cache |
| Server-only application logic | TanStack Start Server Functions |
| Public HTTP endpoint | Server Routes or a dedicated API |

You do not need to adopt every pattern at once. Start with one API client and shared query options. Add SSR forwarding, mutation strategies, and live updates only when the application needs them.

## Final thoughts

TanStack Start 1.0 makes this a good moment to evaluate a full-stack React architecture, but a stable framework does not automatically give you a maintainable data layer.

The important part is choosing clear boundaries: Router coordinates navigation, Query owns server-state caching, the HTTP client owns transport concerns, and the server owns privileged operations.

That's the problem space tanstack-fetch is designed to address. It is not a replacement for TanStack Query or TanStack Start; it is an option for standardizing HTTP behavior alongside them.

**Explore the project:**
- [tanstack-fetch documentation](https://mohamadgarmabi.github.io/tanstack-fetch/)
- [TanStack Start documentation](https://tanstack.com/start/latest/docs/framework/react/overview)
- [tanstack-fetch documentation](https://mohamadgarmabi.github.io/tanstack-fetch/)

If you're building with TanStack Start, which part of the data layer has required the most work in your project: SSR, authentication, caching, or real-time updates?
