# Upload

![Multipart upload with progress](/images/docs-upload.png)

```ts
await api.upload('/files', {
  file,
  fields: { albumId: '1' },
  onUploadProgress: ({ progress }) => setProgress(progress),
})
```

Or build FormData yourself:

```ts
import { createFormData } from 'tanstack-fetch'

const body = createFormData({ file, fields: { albumId: '1' } })
await api.post('/files', { body, onUploadProgress: … })
```

Progress uses XHR under the hood when `onUploadProgress` is set (fetch has no upload progress API).

Example: [`examples/file-upload`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/file-upload)
