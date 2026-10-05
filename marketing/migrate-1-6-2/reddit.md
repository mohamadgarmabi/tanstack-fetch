# Reddit post drafts

Use **cover.jpg** only on platforms that support image posts (e.g. r/reactjs image+text if allowed). Prefer a text/link post with the docs URL.

---

## Title options (pick one)

1. Migrate axios / ky / ofetch / fetch → tanstack-fetch with one CLI (shaped for TanStack Query)
2. I built a migrate CLI: scan axios/ky/ofetch/fetch and rewrite for TanStack Query queryFns
3. Tired of unwrapping `.data` / `.json()` in every queryFn? migrate to tanstack-fetch

---

## Body (r/reactjs, r/nextjs, r/vuejs, r/webdev, r/javascript)

```text
If you use TanStack Query, your queryFn wants: return data, throw on error, honor AbortSignal.

Most HTTP clients need adapters for that. tanstack-fetch is shaped for that model (~4.8KB gzip HTTP core).

In 1.6.2 there's a migrate CLI:

  npx tanstack-fetch migrate --from axios|ky|ofetch|fetch|all --dir ./src
  npx tanstack-fetch migrate --from axios --framework react --write

It reports call sites, applies safe rewrites, and can scaffold React / Vue / Nuxt / Next.js.
For React it asks whether you want FetchProvider (default: no — pass { client: api }).

Docs (migrate guide):
https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate

Not an official TanStack package — just the same Query mental model.

Happy to hear what the CLI catches / misses on real codebases.
```

---

## Short comment / cross-post blurb

```text
CLI: npx tanstack-fetch migrate --from all --dir ./src
Guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate
```

---

## Subreddit notes

| Sub | Tip |
| --- | --- |
| r/reactjs | Lead with Query + React scaffold / no-provider default |
| r/nextjs | Mention `api.server.ts` + `ssr-forward` |
| r/vuejs / r/Nuxt | Lead with ofetch → createFetch + Nuxt plugin |
| r/javascript / r/webdev | Broader “one client for Query” angle |
| r/opensource | Ship announcement tone + MIT + GitHub link |

Avoid link-only posts where rules require discussion. Ask one question at the end (what did the dry-run find?).
