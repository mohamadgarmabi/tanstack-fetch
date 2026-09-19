# Plugins & interceptors

## Built-in plugins

| Plugin | Role |
| --- | --- |
| `trace` | Adds `x-request-id` |
| `ssr-forward` | Forwards cookies / auth on the server |
| `retry-idempotent` | Retries safe methods on retryable statuses |
| `sse-resume` | Drops heartbeats; sends `Last-Event-ID` on reconnect |

```ts
createFetch({
  plugins: ['trace', 'ssr-forward', 'retry-idempotent', 'sse-resume'],
})
```

## Named interceptors

```ts
api.use('locale', {
  order: 25,
  onRequest: (context) => {
    context.request.headers.set('accept-language', 'fa')
    return { action: 'continue', context }
  },
})

api.eject('locale')
```

## Per-request control

```ts
await api.get('/admin', {
  interceptors: {
    use: [extraInterceptor],
    eject: ['retry-idempotent'],
  },
})
```

## Match filters

Interceptors can `match` on `operation`, `method`, `pathPrefix`, or `status`.

Decision actions: `continue` · `skip` · `retry` · `short-circuit` · `drop`.

See [Refresh token recipe](/recipes/refresh-token) for a real 401 → refresh → retry interceptor.
