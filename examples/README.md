# Examples

Small, focused apps — each shows one way to use `tanstack-fetch`.

| Example                              | What it shows                                        |
| ------------------------------------ | ---------------------------------------------------- |
| [`basic-http`](./basic-http)         | Plain `createFetch` — get / post / errors (no React) |
| [`tanstack-query`](./tanstack-query) | `useQuery` + `useMutation` + `queryOptions`          |
| [`auth-status`](./auth-status)       | `getToken` + 4xx (incl. 429) / 5xx handlers            |
| [`file-upload`](./file-upload)       | `api.upload` + `createFormData` + progress           |
| [`sse-live`](./sse-live)             | `api.sse` + React `useSse`                           |
| [`next-ssr`](./next-ssr)             | Next.js App Router prefetch + `ssr-forward`          |
| [`trpc`](./trpc)                     | tRPC + `createTRPCFetchClient` + Query               |

Install once in your app:

```bash
npm install tanstack-fetch
# + peers you need:
npm install @tanstack/react-query   # tanstack-query, auth-status UI
# sse-live also needs: tanstack-fetch/sse (same package entry)
# trpc also needs: @trpc/client @trpc/server @trpc/tanstack-react-query
```

All snippets assume `tanstack-fetch` is installed and (for Vite) `VITE_API_URL` is set.
