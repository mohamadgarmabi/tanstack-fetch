---
title: Upload & download live demo
description: Live api.upload multipart demo plus onDownloadProgress example with createFetch.
---

# Upload & download

:::: framework core

::: tip Framework
**Core** (framework-agnostic)
:::

Pick a file and run **`api.upload()`** — real FormData + `createFetch` (mock response).

<UploadDemo />

## Upload

```ts
await api.upload('/files', {
  file,
  fields: { folder: 'avatars' },
  onUploadProgress: ({ progress }) => setProgress(progress ?? 0),
})
```

## Download with progress

```ts
const blob = await api.get('/files/report.pdf', {
  parseAs: 'blob',
  onDownloadProgress: ({ progress, loaded, total }) => {
    setProgress(progress ?? 0)
    console.log(`${loaded} / ${total}`)
  },
})
```

Guide: [Upload & download](/guide/upload) · example: [`examples/file-upload`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)

::::
