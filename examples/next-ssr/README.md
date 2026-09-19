# Example: Next.js SSR

App Router page that builds a server client with `ssr-forward`, prefetches into TanStack Query, then hydrates on the client.

## Install

```bash
npm install tanstack-fetch @tanstack/react-query next react react-dom
```

Set `API_URL` (or `NEXT_PUBLIC_API_URL`) in `.env`.

## Files

- [`src/lib/api.ts`](./src/lib/api.ts) — `createServerApi` + browser `api`
- [`src/app/users/page.tsx`](./src/app/users/page.tsx) — SSR prefetch
- [`src/app/users/users-client.tsx`](./src/app/users/users-client.tsx) — client list
- [`src/app/users/users.hook.ts`](./src/app/users/users.hook.ts)
- [`src/app/users/users.type.ts`](./src/app/users/users.type.ts)
