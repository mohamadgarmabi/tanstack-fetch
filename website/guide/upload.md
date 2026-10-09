---
title: Upload & download progress
description: Multipart upload with onUploadProgress and file download with onDownloadProgress — no second HTTP library.
---

# Upload & download progress

![Multipart upload with progress](/images/docs-upload.png)

## Live demo

<UploadDemo />

## Upload

```ts
await api.upload('/files', {
  file,
  fields: { albumId: '1' },
  onUploadProgress: ({ progress, loaded, total }) => {
    setProgress(progress ?? 0)
    console.log(loaded, total)
  },
})
```

Or build FormData yourself:

```ts
import { createFormData } from 'tanstack-fetch'

const body = createFormData({ file, fields: { albumId: '1' } })
await api.post('/files', { body, onUploadProgress: … })
```

## Download

```ts
const blob = await api.get('/files/report.pdf', {
  parseAs: 'blob',
  onDownloadProgress: ({ progress, loaded, total }) => {
    setProgress(progress ?? 0)
    console.log(loaded, '/', total)
  },
})

// e.g. trigger a browser save
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = 'report.pdf'
link.click()
URL.revokeObjectURL(url)
```

Works on any method (`get` / `post` / …) — same options object:

```ts
await api.post('/export', {
  body: { format: 'csv' },
  parseAs: 'blob',
  onDownloadProgress: ({ progress }) => setProgress(progress ?? 0),
})
```

## Notes

- Progress uses **XHR** under the hood when `onUploadProgress` and/or `onDownloadProgress` is set (fetch has no reliable progress API).
- `progress` is `loaded / total` when `Content-Length` (download) or the upload size is known; otherwise only `loaded` updates.
- Browser-only — on the server, omit these handlers and use plain `fetch`.

Example: [`examples/file-upload`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)
