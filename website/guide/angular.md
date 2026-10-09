---
title: Angular
description: Angular helpers for tanstack-fetch — provideFetchClient, injectFetch, and useSse signals with TanStack Angular Query.
---

# Angular

::: tip Framework
**Angular** · `tanstack-fetch/angular` · `@tanstack/angular-query-experimental`
:::

Optional helpers from `tanstack-fetch/angular`. Same client as every other stack — DI instead of React context.

## Install

```bash
npm install tanstack-fetch @angular/core
# optional Query
npm install @tanstack/angular-query-experimental
```

`@angular/core` is an optional peer (`>=17`).

## `provideFetchClient` + `injectFetch`

```ts
import { bootstrapApplication } from '@angular/platform-browser'
import { createFetch } from 'tanstack-fetch'
import { provideFetchClient, injectFetch } from 'tanstack-fetch/angular'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { isFetchError } from 'tanstack-fetch'
import { Component } from '@angular/core'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
})

bootstrapApplication(AppComponent, {
  providers: [provideFetchClient({ client: api })],
})

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

## `useSse`

Returns Angular **signals**. Prefer `{ client }` from `tanstack-fetch/sse`.

```ts
import { Component } from '@angular/core'
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/angular'

const api = createFetch({ plugins: ['sse-resume'] })

@Component({
  selector: 'app-orders-live',
  template: `
    <p>{{ status() }}</p>
    <pre>{{ data() | json }}</pre>
    <button type="button" (click)="close()">Stop</button>
  `,
})
export class OrdersLiveComponent {
  private readonly stream = useSse<OrderEvent>('/orders/stream', { client: api })
  readonly data = this.stream.data
  readonly status = this.stream.status
  readonly close = this.stream.close
}
```

## Migrate CLI

```bash
npx tanstack-fetch migrate --from axios --framework angular --write
```

## Related

- [SSE · Angular](/guide/sse#angular)
- [tRPC · Angular](/guide/trpc#angular)
- [Migrate](/guide/migrate)
