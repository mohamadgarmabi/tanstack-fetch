---
title: Upload & download live demo
description: Live api.upload multipart demo plus onDownloadProgress example with createFetch.
---

# Upload & download

![Upload & download live demo](/images/page-examples-upload.jpg)

:::: framework core

::: tip Framework
**Core** (framework-agnostic)
:::

Pick a file and run **`api.upload()`** — real FormData + `createFetch` (mock response).

<UploadDemo />

`fetch` has no upload progress event, and its download progress needs manual stream reading. tanstack-fetch switches the request to `XMLHttpRequest` when you pass a progress handler, and keeps everything else the same: interceptors, auth, retries, typed responses and `FetchError`s.

## Upload a file with progress

```ts
import { createFetch } from 'tanstack-fetch/sse' // upload + progress need the full client

const api = createFetch({ baseUrl: import.meta.env.VITE_API_URL })

const saved = await api.upload<{ id: string; url: string }>('/files', {
  file,
  fields: { folder: 'avatars' },
  onUploadProgress: ({ progress }) => setProgress(progress ?? 0),
})
```

`upload()` lives on clients from `tanstack-fetch/sse`, `/live` and the framework providers. The slim core `tanstack-fetch` client has no `upload()` and ignores progress handlers.

### `upload()` options

| Option             | Default  | Meaning                                                                                                    |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `file`             | —        | One `Blob` / `File`, appended under `fieldName`                                                            |
| `files`            | —        | Several files, each appended under the same `fieldName`                                                    |
| `fields`           | —        | Extra form fields: strings, numbers, booleans, `Blob`s or arrays of them. `null` / `undefined` are skipped |
| `fieldName`        | `'file'` | Form field name for `file` / `files`                                                                       |
| `body`             | —        | A ready body: `FormData`, `Blob`, `ArrayBuffer`, `URLSearchParams` or `string`                             |
| `method`           | `'POST'` | `'POST'`, `'PUT'` or `'PATCH'`                                                                             |
| `onUploadProgress` | —        | `({ loaded, total, progress }) => void`                                                                    |

All other request options work too: `headers`, `signal`, `timeoutMs`, `query`, `parseAs`, `onDownloadProgress`, `interceptors`. `progress` is `loaded / total` (0–1) when the size is known, otherwise `undefined`.

`body` can be combined with `file`, `files` or `fields` only when it is a `FormData`; they are appended to it. Any other `body` type with those options throws.

```ts
// several files under "photos"
await api.upload('/albums/1/photos', { files: [...input.files!], fieldName: 'photos' })

// raw PUT to a presigned storage URL: absolute URL, no auth header
await api.upload(presignedUrl, {
  method: 'PUT',
  body: file,
  interceptors: { eject: ['auth'] },
  onUploadProgress: ({ progress }) => setProgress(progress ?? 0),
})
```

## FormData and the multipart Content-Type

Don't set `content-type` for a `FormData` body. The browser has to write `multipart/form-data; boundary=…` itself, and the boundary is only known when the body is sent. A `content-type` inherited from the client (for example `headers: { 'content-type': 'application/json' }` in `createFetch`) is dropped for `FormData` bodies, so the boundary is always set. The fetch path does this since 2.2.1; before, the inherited header was sent and the server could not parse the body.

## When the XHR path is used

A request goes through XHR when **all** of these hold:

- the client is the full client (`/sse`, `/live`, providers),
- `onUploadProgress` or `onDownloadProgress` is set,
- `XMLHttpRequest` exists, so in the browser only.

Otherwise it is a normal `fetch`. On the server the handlers never fire. Over XHR, cookies are sent cross-origin only with `credentials: 'include'`.

## Abort and timeout an upload

Pass a `signal` to cancel. The XHR is aborted and the call rejects with an `AbortError`, which `isAbortError` matches:

```ts
import { isAbortError } from 'tanstack-fetch'

const controller = new AbortController()
cancelButton.onclick = () => controller.abort()

try {
  await api.upload('/files', {
    file,
    signal: controller.signal,
    onUploadProgress: ({ progress }) => setProgress(progress ?? 0),
  })
} catch (error) {
  if (!isAbortError(error)) throw error
}
```

The default `timeoutMs` is 30 s per attempt, and it covers the whole upload. Raise it for big files: `timeoutMs: 10 * 60_000`, or `0` to turn it off. Over XHR a timeout also rejects with `AbortError`, not `TimeoutError`.

## Upload with TanStack Query

```tsx
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from './api'

export const useUploadAvatar = () => {
  const [progress, setProgress] = useState(0)
  const mutation = useMutation({
    mutationFn: (file: File) =>
      api.upload<{ url: string }>('/me/avatar', {
        file,
        onUploadProgress: (event) => setProgress(event.progress ?? 0),
      }),
  })
  return { ...mutation, progress }
}
```

## Download with progress

```ts
const blob = await api.get<Blob>('/files/report.pdf', {
  parseAs: 'blob',
  onDownloadProgress: ({ progress, loaded, total }) => {
    setProgress(progress ?? 0)
    console.log(`${loaded} / ${total}`)
  },
})
```

`total` comes from `Content-Length`; without it, only `loaded` grows. With a progress handler the whole response is buffered before it resolves, so use `parseAs: 'blob'` or `'arrayBuffer'` rather than `'stream'`.

Guide: [Upload & download](/guide/upload) · example: [`examples/file-upload`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)

## Related

- [Upload & download guide](/guide/upload)
- [FetchClient](/api/fetch-client): every request option
- [Error API](/api/errors): `isAbortError` and `FetchError`
- [Mocking](/guide/mocking): fake upload endpoints in development

::::
