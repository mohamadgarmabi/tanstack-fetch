# Example: SSE live feed

Uses `tanstack-fetch/sse` + `FetchProvider` + `useSse`.

## Install

```bash
npm install tanstack-fetch react
```

## Files

- [`src/lib/api.ts`](./src/lib/api.ts) — client from `tanstack-fetch/sse`
- [`src/main.tsx`](./src/main.tsx) — wrap with `FetchProvider`
- [`src/sse-live.hook.ts`](./src/sse-live.hook.ts) — `useSse` + event list
- [`src/App.tsx`](./src/App.tsx) — UI only
