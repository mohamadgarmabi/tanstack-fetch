# SSE

![Server-Sent Events over fetch with Authorization](/images/docs-sse.png)

Import from `tanstack-fetch/sse` so streams use `fetch` (cookies + `Authorization` work).

```ts
import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})
```

## Simple handlers

```ts
const stream = api.sse<OrderEvent>('/orders/stream', {
  onMessage: (data) => console.log(data),
})

stream.close()
```

## Async iteration

```ts
for await (const event of api.sse<OrderEvent>('/orders/stream', { signal })) {
  console.log(event.data)
}
```

## React `useSse`

```tsx
import { createFetch } from 'tanstack-fetch/sse'
import { FetchProvider, useSse } from 'tanstack-fetch/react'

const api = createFetch({ plugins: ['sse-resume'] })

<FetchProvider client={api}>
  <LiveFeed />
</FetchProvider>
```

Example: [`examples/sse-live`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/examples/sse-live)
