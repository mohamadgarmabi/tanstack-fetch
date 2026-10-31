---
title: Plugin API
description: Plugin and interceptor API for tanstack-fetch — built-in names and createRefreshTokenInterceptor.
---

# Plugin API

![Plugin pipeline](/images/docs-plugins.png)

```ts
import { pluginFactories, createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'
```

Built-in names: `trace` · `ssr-forward` · `retry-idempotent` · `sse-resume`.

Interceptor hooks, including the live-connection hooks `onLiveOpen` / `onLiveMessage` / `onLiveClose` (1.8.0): [Plugins guide · Interceptor hooks](/guide/plugins#interceptor-hooks).

Factories for app wiring: `createAuthInterceptor` · `createStatusInterceptor` · **`createRefreshTokenInterceptor`** · `createTraceInterceptor` · …

On core `tanstack-fetch`, pass factories in `createFetch({ interceptors: [createAuthInterceptor(…), createStatusInterceptor(…), createTraceInterceptor()] })`. `tanstack-fetch/sse`, `/live`, `/trpc` and providers also accept named plugins via `plugins: […]`. For refresh token, call the factory and `api.use`:

```ts
api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{ accessToken: string }>('/auth/refresh', {
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      /* update token from body */
    },
    before: { getExpiresAt: () => expiresAt, skewMs: 60_000 },
    after: { enabled: true },
  }),
)
```

See [Refresh token](/recipes/refresh-token).
