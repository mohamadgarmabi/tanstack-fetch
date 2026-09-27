---
title: DevTools preview
description: Live tanstack-fetch DevTools — SSE event list, call graph, one-line setup.
---

# DevTools

Bottom dock with request list, **SSE event list**, **caller file** (e.g. `profile.hook.ts`), and a **call graph**.

Click a graph node → pick **Cursor / Zed / VS Code** → opens via deep link (last choice remembered).

**Toggle:** **Alt+Shift+F** (macOS: **⌥⇧F**)

<DevtoolsDemo />

## Install

```ts
import { createFetch } from 'tanstack-fetch'
import { setupDevtools } from 'tanstack-fetch/devtools'

const api = createFetch({ plugins: ['trace'] })
setupDevtools(api) // registers interceptor + mounts dock
```

Prefer `plugins: ['trace']` so each entry has a stable `requestId`.

### Options

```ts
setupDevtools(api, {
  http: true,
  sse: true,
  ssr: true,
  trpc: true,
  open: true, // start expanded
})
```

### Advanced (share one store across clients)

```ts
import { createDevtools, mountDevtools } from 'tanstack-fetch/devtools'

const dt = createDevtools()
const api = createFetch({ plugins: ['trace'], interceptors: [dt.interceptor] })
mountDevtools({ store: dt.store })
```
