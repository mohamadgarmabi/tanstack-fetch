---
title: Upload live demo
description: Live api.upload multipart demo with createFetch.
---

# Upload

Pick a file and run **`api.upload()`** — real FormData + `createFetch` (mock response).

<UploadDemo />

## In your app

```ts
await api.upload('/files', {
  file,
  fields: { folder: 'avatars' },
  onUploadProgress: ({ progress }) => setProgress(progress ?? 0),
})
```

Guide: [Upload](/guide/upload) · example: [`examples/file-upload`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)
