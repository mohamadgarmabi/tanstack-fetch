# Plugin API

![Plugin pipeline](/images/docs-plugins.png)

```ts
import { pluginFactories } from 'tanstack-fetch/plugins'
```

Built-in names: `trace` · `ssr-forward` · `retry-idempotent` · `sse-resume` · (see package exports).

Prefer enabling via `createFetch({ plugins: […] })` unless you need the raw factories.
