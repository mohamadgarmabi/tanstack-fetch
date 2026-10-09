---
title: OpenAPI CLI
description: Generate a typed tanstack-fetch client from an OpenAPI document, or migrate from axios / ky / ofetch / fetch.
---

# OpenAPI CLI

Generate typed clients from an OpenAPI spec:

```bash
npx tanstack-fetch generate --spec ./openapi.yaml --out ./src/api
```

## Migrate from axios / ky / ofetch / fetch

```bash
npx tanstack-fetch doctor --dir ./src
npx tanstack-fetch migrate --from axios --framework react --dir ./src --write
npx tanstack-fetch migrate --from ofetch --framework nuxt --write
npx tanstack-fetch migrate --from fetch --framework nextjs --write
npx tanstack-fetch migrate --from axios --framework vue --write
npx tanstack-fetch migrate --from axios --framework solid --write
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
```

Full mapping + scaffolds: [Migrate](/guide/migrate).

The CLI ships as the `tanstack-fetch` binary from the same package.
