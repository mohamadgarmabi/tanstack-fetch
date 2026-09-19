# Example: auth + status handlers

Simple React page that wires Bearer token and 401 / 403 / 404 / 5xx callbacks.

## Install

```bash
npm install tanstack-fetch react
```

## Files

- [`src/lib/api.ts`](./src/lib/api.ts) — token + status handlers
- [`src/auth-status.hook.ts`](./src/auth-status.hook.ts) — load profile / typed errors
- [`src/App.tsx`](./src/App.tsx) — UI only
