# Status handlers

Resolution order: **exact status** → **`4xx` / `5xx` buckets** → **`default`**.

## Shortcuts on `createFetch`

| Option                         | HTTP      |
| ------------------------------ | --------- |
| `onBadRequest`                 | 400       |
| `onUnauthorized`               | 401       |
| `onForbidden`                  | 403       |
| `onNotFound`                   | 404       |
| `onMethodNotAllowed`           | 405       |
| `onRequestTimeout`             | 408       |
| `onConflict`                   | 409       |
| `onGone`                       | 410       |
| `onPayloadTooLarge`            | 413       |
| `onUnsupportedMediaType`       | 415       |
| `onUnprocessableEntity`        | 422       |
| `onTooManyRequests`            | 429       |
| `onUnavailableForLegalReasons` | 451       |
| `onClientError`                | other 4xx |
| `onServerError`                | 5xx       |

## Advanced `onStatus`

```ts
onStatus: {
  401: () => redirect('/login'),
  429: ({ context }) => ({
    action: 'retry',
    delayMs: parseRetryAfter(context.response?.headers, 1000),
  }),
  '4xx': ({ status }) => console.warn(status),
  '5xx': ({ status }) => console.error(status),
  default: ({ status }) => console.warn('unhandled', status),
}
```

Handlers may return `{ action: 'retry', delayMs? }` to retry once.
