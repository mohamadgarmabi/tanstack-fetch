# Internal linking plan — tanstack-fetch

**Purpose:** Move visitors from discovery (home, comparison, blogs) → understanding (why, tanstack-query) → conversion (getting-started, migrate) → advanced capability (ssr, sse, recipes) without cannibalizing primary keywords.

**Rules:**

1. Each page has **one primary keyword** (see `keyword-research.json`).
2. Link with descriptive anchors that match user problems, not “click here”.
3. Framework **blogs** link to framework **guides** for API detail; guides link up to blogs for narrative comparisons.
4. Always preserve independent-project positioning when linking near TanStack product names.
5. Prefer existing URLs; proposed recipe URLs are optional until approved.

Base: `https://mohamadgarmabi.github.io/tanstack-fetch`

---

## 1. Hub hierarchy

```text
/ (commercial hub)
├── /guide/introduction          (docs entry)
├── /guide/getting-started       (conversion)
├── /guide/why                   (mental model)
├── /guide/comparison            (alternatives hub)
├── /guide/migrate               (migration hub)
├── /guide/tanstack-query        (Query integration hub)
├── /guide/ssr                   (SSR hub)
├── /guide/sse                   (SSE hub)
├── /guide/configuration         (config hub)
├── /guide/errors                (errors hub)
├── /guide/plugins               (interceptors hub)
├── /recipes/*                   (problem recipes)
├── /blog/*                      (framework narratives)
└── /examples/*                  (live demos)
```

---

## 2. Required links from commercial hubs

### `/` (home)

| Link to                  | Anchor intent (examples)        |
| ------------------------ | ------------------------------- |
| `/guide/getting-started` | Get started / install           |
| `/guide/why`             | Why this matches TanStack Query |
| `/guide/comparison`      | Compare with axios, ky, ofetch  |
| `/guide/migrate`         | Migrate from axios / CLI        |
| `/guide/tanstack-query`  | Use with TanStack Query         |
| `/guide/ssr`             | SSR cookies (Next.js / Nuxt)    |
| `/guide/sse`             | SSE with Authorization          |
| GitHub + npm             | Brand / install trust           |

### `/guide/comparison`

| Link to                            | Why                               |
| ---------------------------------- | --------------------------------- |
| `/guide/migrate`                   | Next step after “switch” decision |
| `/guide/why`                       | Mental model behind the matrix    |
| `/recipes/refresh-token`           | Interceptor / refresh row depth   |
| `/guide/ssr`                       | SSR cookies row depth             |
| `/guide/sse`                       | SSE Authorization row depth       |
| `/blog/react-axios-tanstack-fetch` | React-specific narrative          |
| `/guide/getting-started`           | Convert evaluators                |

### `/guide/migrate`

| Link to                      | Why                              |
| ---------------------------- | -------------------------------- |
| `/guide/comparison`          | Decision support                 |
| `/guide/getting-started`     | Post-migration path              |
| `/guide/openapi`             | Related codegen CLI              |
| `/blog/tanstack-fetch-1-6-3` | Migrate release context          |
| `/blog/tanstack-fetch-1-7-0` | doctor CLI                       |
| Framework blogs              | Stack-specific migration stories |
| `/guide/errors`              | FetchError after unwrap removal  |

---

## 3. Query & onboarding spine

```text
introduction → getting-started → tanstack-query → why
                     ↓
              configuration → errors → plugins
```

| From                     | To                                                                     | Anchor theme          |
| ------------------------ | ---------------------------------------------------------------------- | --------------------- |
| `/guide/introduction`    | getting-started, why, comparison                                       | Product → action      |
| `/guide/getting-started` | tanstack-query, errors, configuration, framework guide matching picker | Next steps            |
| `/guide/why`             | tanstack-query, comparison, home                                       | Reinforce contract    |
| `/guide/tanstack-query`  | ssr, sse, react/vue/… guides, Start blog                               | Framework branching   |
| `/guide/errors`          | api/errors, configuration, tanstack-query                              | Typed errors in Query |
| `/guide/configuration`   | plugins, refresh-token, rate-limit                                     | Handlers → recipes    |
| `/guide/plugins`         | refresh-token, ssr, sse, rate-limit                                    | Plugin → problem      |

---

## 4. SSR cluster

| From                                | To                                                                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/guide/ssr`                        | `/blog/nextjs-fetch-tanstack-fetch`, `/blog/nuxt-ofetch-tanstack-fetch`, `/examples/next-ssr`, `/examples/nuxt-ssr`, `/guide/tanstack-query`, `/guide/plugins` |
| `/blog/nextjs-fetch-tanstack-fetch` | `/guide/ssr` (canonical), `/guide/tanstack-query`, `/recipes/refresh-token`, `/guide/sse`, `/guide/migrate`                                                    |
| `/blog/nuxt-ofetch-tanstack-fetch`  | `/guide/ssr`, `/guide/vue`, `/guide/migrate`, `/guide/comparison`                                                                                              |

**Cannibalization note:** Blog posts should say “full SSR cookie guide” and link to `/guide/ssr` as the canonical reference.

---

## 5. SSE cluster

| From                           | To                                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/guide/sse`                   | `/guide/plugins` (`sse-resume`), `/guide/tanstack-query`, `/recipes/refresh-token`, proposed `/recipes/eventsource-auth-headers`, proposed `/recipes/sse-resume`, React/Vue SSE sections in blogs |
| Proposed EventSource recipe    | `/guide/sse`, `/recipes/refresh-token`, `/guide/tanstack-query`                                                                                                                                   |
| Proposed SSE resume recipe     | `/guide/sse`, `/guide/plugins`                                                                                                                                                                    |
| Framework blogs (SSE sections) | Always link **up** to `/guide/sse`                                                                                                                                                                |

---

## 6. Auth / errors / retries cluster

```text
configuration ──► refresh-token
       │
       ├──► rate-limit
       ├──► errors
       └──► plugins
```

| From                     | To                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `/recipes/refresh-token` | `/guide/plugins`, `/guide/configuration`, `/guide/migrate` (axios interceptor mapping), `/guide/sse` (SSE + auth) |
| `/recipes/rate-limit`    | `/guide/configuration`, `/api/create-fetch` (`parseRetryAfter`)                                                   |
| `/guide/errors`          | `/api/errors`, `/guide/tanstack-query`                                                                            |

---

## 7. Framework blog ↔ guide pairs

| Blog                                         | Guide                       | Also link                                               |
| -------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| `/blog/react-axios-tanstack-fetch`           | `/guide/react`              | comparison, migrate, sse, refresh-token, tanstack-query |
| `/blog/vue-ofetch-tanstack-fetch`            | `/guide/vue`                | comparison, migrate                                     |
| `/blog/nuxt-ofetch-tanstack-fetch`           | `/guide/vue` + `/guide/ssr` | migrate, comparison                                     |
| `/blog/nextjs-fetch-tanstack-fetch`          | `/guide/ssr` (+ react)      | tanstack-query, migrate                                 |
| `/blog/angular-http-client-tanstack-fetch`   | `/guide/angular`            | plugins, refresh-token, comparison                      |
| `/blog/solid-fetch-tanstack-fetch`           | `/guide/solid`              | tanstack-query, migrate                                 |
| `/blog/sveltekit-fetch-tanstack-fetch`       | `/guide/svelte`             | ssr, migrate                                            |
| `/blog/tanstack-start-router-tanstack-fetch` | `/guide/tanstack-query`     | trpc, ssr                                               |

**Pattern for every framework blog footer:**

1. Framework guide (API)
2. Comparison
3. Migrate
4. Getting started
5. Relevant recipe (SSR / SSE / refresh)

---

## 8. Examples & playground

| From                   | To                                           |
| ---------------------- | -------------------------------------------- |
| `/examples/playground` | getting-started, relevant guides by demo tag |
| `/examples/react`      | `/guide/react`, `/guide/tanstack-query`      |
| `/examples/next-ssr`   | `/guide/ssr`, Next blog                      |
| `/examples/nuxt-ssr`   | `/guide/ssr`, Nuxt blog                      |
| Guide “live demo” CTAs | Matching `/examples/*`                       |

---

## 9. Blog index & release notes

| From                         | Policy                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `/blog/`                     | Feature blogs first; release notes secondary                                      |
| Short release posts          | Link to migrate / doctor / framework guides; **do not** target non-brand keywords |
| `/blog/tanstack-fetch-1-6-3` | → `/guide/migrate`                                                                |
| `/blog/tanstack-fetch-1-7-0` | → `/guide/migrate`, framework guides, doctor section                              |

---

## 10. Anchor text guidelines

| Prefer                                             | Avoid                                |
| -------------------------------------------------- | ------------------------------------ |
| “Forward cookies in Next.js SSR”                   | “SSR page”                           |
| “Migrate from axios with the CLI”                  | “click here”                         |
| “Handle EventSource auth with fetch SSE”           | “SSE” alone on every link            |
| “Prevent duplicate refresh-token calls”            | “refresh token” on unrelated pages   |
| “Compare axios, ky, and ofetch for TanStack Query” | “alternatives” without Query context |

Use Query-qualified anchors for commercial links so the independent package does not look like official TanStack navigation.

---

## 11. Implementation checklist (post-approval)

- [ ] Home CTAs match hub list above
- [ ] Comparison matrix rows deep-link to ssr / sse / refresh-token / migrate
- [ ] Every framework blog has guide + migrate + comparison footer
- [ ] SSR blog ↔ `/guide/ssr` reciprocal links
- [ ] SSE guide links to recipes (existing + approved new)
- [ ] Refresh-token recipe links to migrate (axios interceptor angle)
- [ ] Docs hub (`/docs/`) lists recipes and comparison prominently
- [ ] No two pages competing with identical H1 keyword phrasing

---

## 12. Link graph priorities (effort vs impact)

| Priority | Work                                                           |
| -------- | -------------------------------------------------------------- |
| P0       | Home → getting-started / comparison / migrate / tanstack-query |
| P0       | Comparison ↔ migrate reciprocal                                |
| P1       | SSR guide ↔ Next/Nuxt blogs ↔ examples                         |
| P1       | SSE guide ↔ plugins ↔ refresh-token ↔ (new recipes)            |
| P1       | Framework blog footers standardized                            |
| P2       | Errors / configuration / rate-limit cross-links                |
| P2       | Release notes → canonical guides only                          |
