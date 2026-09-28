# Example: SSE live feed

Uses `tanstack-fetch/sse` + `useSse({ client })` — **no FetchProvider required**.

## Install

```bash
npm install tanstack-fetch react
```

## Files

- [`src/lib/api.ts`](./src/lib/api.ts) — client from `tanstack-fetch/sse`
- [`src/sse-live.hook.ts`](./src/sse-live.hook.ts) — `useSse({ client: api })` + event list
- [`src/App.tsx`](./src/App.tsx) — UI only
