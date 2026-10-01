# FetchClient

Methods on the client returned by `createFetch`. Pass a route map, `createFetch<Routes>()`, to infer response types from the path. See [Typed routes](/guide/typed-routes).

| Method                                      | Description                    |
| ------------------------------------------- | ------------------------------ |
| `get` / `post` / `put` / `patch` / `delete` | Typed HTTP helpers             |
| `request(method, path, options?)`           | Generic verb                   |
| `upload(path, options?)`                    | Multipart + progress           |
| `sse(path, options?)`                       | Only from `tanstack-fetch/sse` |
| `use(name, interceptor)`                    | Register interceptor           |
| `eject(name)`                               | Remove interceptor             |

## Request options

| Option             | Notes                                                              |
| ------------------ | ------------------------------------------------------------------ |
| `params`           | Typed from path (`:id` / `{id}`), required when placeholders exist |
| `query`            | Query string                                                       |
| `body`             | JSON / FormData / …                                                |
| `headers`          | Per-request headers                                                |
| `signal`           | AbortSignal (pass Query’s)                                         |
| `timeoutMs`        | Override client timeout                                            |
| `throwOnError`     | Override client default                                            |
| `parseAs`          | `json` \| `text` \| `blob`                                         |
| `operation`        | Name for interceptor match                                         |
| `interceptors`     | Per-request `use` / `eject`                                        |
| `onUploadProgress` | Browser upload progress                                            |
