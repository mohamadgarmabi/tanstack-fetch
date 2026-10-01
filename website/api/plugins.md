# Plugin API

![Plugin pipeline](/images/docs-plugins.png)

```ts
import { pluginFactories, createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'
```

Built-in names: `trace` · `ssr-forward` · `retry-idempotent` · `sse-resume`.

Factories for app wiring: `createAuthInterceptor` · `createStatusInterceptor` · **`createRefreshTokenInterceptor`** · `createTraceInterceptor` · …

Prefer enabling named plugins via `createFetch({ plugins: […] })`. For refresh token, call the factory and `api.use`:

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
