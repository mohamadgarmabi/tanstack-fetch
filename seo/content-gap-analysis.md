# Content gap analysis — tanstack-fetch

**Research date:** 2026-10-13  
**Site:** https://mohamadgarmabi.github.io/tanstack-fetch/  
**Positioning:** Independent TypeScript HTTP client shaped for TanStack Query — **not** an official TanStack package (author: Mohammad Garmabi).

**Data limits:** No Google Search Console export in the repo. No keyword-volume or difficulty tools were available. Search volumes, KD, CPC, traffic estimates, and rankings are **unknown**. SERP notes below are **observed samples**, not verified positions.

---

## 1. Existing content inventory (verified routes)

### Product / commercial

| URL                      | Role today                        | Primary opportunity                          |
| ------------------------ | --------------------------------- | -------------------------------------------- |
| `/`                      | Brand + commercial landing        | HTTP / typed fetch client for TanStack Query |
| `/guide/introduction`    | Product overview                  | Typed API client positioning                 |
| `/guide/why`             | Mental model vs axios/ky/ofetch   | Why queryFn-shaped client                    |
| `/guide/comparison`      | Feature matrix vs axios/ky/ofetch | Axios alternative for TanStack Query         |
| `/guide/migrate`         | CLI + call-site mapping           | Migrate axios/ky/ofetch → createFetch        |
| `/guide/getting-started` | Install + first request           | Onboarding conversion                        |

### Core guides

| URL                                                     | Role today                                    |
| ------------------------------------------------------- | --------------------------------------------- |
| `/guide/tanstack-query`                                 | Query integration (Start/Router + frameworks) |
| `/guide/configuration`                                  | createFetch options, 401–429 handlers         |
| `/guide/errors`                                         | FetchError / isFetchError                     |
| `/guide/plugins`                                        | Built-in plugins + interceptors               |
| `/guide/ssr`                                            | ssr-forward, Next.js + Nuxt                   |
| `/guide/sse`                                            | fetch-based SSE, useSse                       |
| `/guide/react`, `/vue`, `/angular`, `/solid`, `/svelte` | Framework adapters                            |
| `/guide/trpc`, `/upload`, `/openapi`, `/skill`          | Adjacent capabilities                         |

### Recipes (high problem-intent)

| URL                      | Role today                |
| ------------------------ | ------------------------- |
| `/recipes/refresh-token` | Single-flight 401 refresh |
| `/recipes/rate-limit`    | 429 + Retry-After         |

### Framework blogs (commercial investigation)

| URL                                          | Angle                               |
| -------------------------------------------- | ----------------------------------- |
| `/blog/react-axios-tanstack-fetch`           | React + axios → createFetch         |
| `/blog/nextjs-fetch-tanstack-fetch`          | Next App Router + cookies + hydrate |
| `/blog/nuxt-ofetch-tanstack-fetch`           | Nuxt $fetch/ofetch                  |
| `/blog/vue-ofetch-tanstack-fetch`            | Vue ofetch/axios                    |
| `/blog/angular-http-client-tanstack-fetch`   | Angular HttpClient                  |
| `/blog/solid-fetch-tanstack-fetch`           | Solid                               |
| `/blog/sveltekit-fetch-tanstack-fetch`       | Svelte/SvelteKit                    |
| `/blog/tanstack-start-router-tanstack-fetch` | TanStack Start/Router               |

### Technical SEO (observed)

| Finding                        | Status        | Notes                                         |
| ------------------------------ | ------------- | --------------------------------------------- |
| `robots.txt`                   | Present       | Allows `/`; dual sitemap refs                 |
| Sitemaps                       | Present       | `sitemap-pages.xml` + `sitemap.xml`           |
| Canonical / OG                 | Configured    | VitePress `config.ts`                         |
| Page titles / descriptions     | Mostly strong | Frontmatter present on guides, recipes, blogs |
| GSC / analytics in repo        | Not found     | Metrics remain null                           |
| Independent-project disclaimer | Partial       | Must stay explicit near TanStack naming       |

---

## 2. Coverage by keyword cluster

### P0 — `tanstack_query_http_client`

| Status                    | Detail                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Covered**               | Home, why, introduction, tanstack-query, getting-started                                                                       |
| **Gap**                   | Clear single primary URL per keyword (cannibalization among `/`, `/guide/why`, `/guide/tanstack-query`, `/guide/introduction`) |
| **Competing SERP themes** | Official Query docs (queryFn/cancellation); generic typed fetch wrappers                                                       |
| **Action**                | Optimize existing — do **not** add another product landing                                                                     |

### P0 — `axios_ky_ofetch_alternatives`

| Status                    | Detail                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Covered**               | comparison, migrate, React/Vue/Nuxt blogs                                                                                        |
| **Gap**                   | Honest “when stay on axios” already exists; Query-qualified titles could be sharper; axios→raw-fetch educational SERP is crowded |
| **Competing SERP themes** | ky/ofetch marketing; evergreen axios-vs-fetch posts                                                                              |
| **Action**                | Strengthen comparison (commercial) + migrate (how-to). Avoid new generic “axios alternative” page                                |

### P1 — `typescript_typed_http`

| Status                    | Detail                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------ |
| **Covered**               | Home hero, introduction, API refs, 1.6 typed params notes                            |
| **Gap**                   | Practical walkthrough for typed path params / bodies (beyond API tables)             |
| **Competing SERP themes** | safe-fetch, mongez-http, fetchflow, and many tiny wrappers                           |
| **Action**                | Prefer expanding getting-started / API examples; optional short guide only if needed |

### P1 — `server_sent_events`

| Status                    | Detail                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Covered**               | `/guide/sse`, plugins (`sse-resume`), framework blog SSE sections                                                                      |
| **Gap**                   | Problem-first pages for **EventSource auth headers**, **Last-Event-ID resume**, **SSE + token refresh**, **queryClient cache updates** |
| **Competing SERP themes** | EventSource tutorials; sparse Query+SSE library docs                                                                                   |
| **Action**                | Highest **create_new** opportunity set (or deepen SSE guide carefully)                                                                 |

### P1 — `nextjs_ssr_nuxt`

| Status                    | Detail                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Covered**               | `/guide/ssr`, Next + Nuxt blogs, examples                                                                              |
| **Gap**                   | Discoverability of cookie-forwarding as the headline problem; risk of competing with official Query SSR hydration docs |
| **Competing SERP themes** | Next.js cookie blogs; TanStack Query GitHub discussions; official Query SSR                                            |
| **Action**                | Optimize SSR guide + Next blog; link out to official Query hydration docs                                              |

### P2 — `framework_integrations`

| Status      | Detail                                                                         |
| ----------- | ------------------------------------------------------------------------------ |
| **Covered** | Guide + blog pair for React, Vue/Nuxt, Angular, Solid, Svelte/SvelteKit, Start |
| **Gap**     | Internal linking / hub discoverability more than missing pages                 |
| **Action**  | Audit cross-links; **no** new thin framework landings                          |

### P2 — `http_errors_auth_and_retries`

| Status      | Detail                                                                            |
| ----------- | --------------------------------------------------------------------------------- |
| **Covered** | errors, configuration, plugins, refresh-token, rate-limit                         |
| **Gap**     | Titles/H2s that match problem phrasing (“prevent multiple refresh”, “401 vs 403”) |
| **Action**  | Optimize recipes and configuration — strong product fit, low new-page need        |

### P2 — `developer_tools_and_migration_cli`

| Status      | Detail                                                                     |
| ----------- | -------------------------------------------------------------------------- |
| **Covered** | migrate, openapi, 1.6.3 / 1.7.0 blog posts (doctor)                        |
| **Gap**     | Explicit limitations, dry-run behavior, checklist, doctor detection scope  |
| **Action**  | Deepen migrate (+ doctor section or link); no separate tool marketing site |

### P3 — `brand_and_author_discovery`

| Status      | Detail                                                     |
| ----------- | ---------------------------------------------------------- |
| **Covered** | Home, docs hub, GitHub, npm install paths                  |
| **Gap**     | Consistency of author attribution + independent disclaimer |
| **Action**  | Maintain; monitor branded SERP                             |

---

## 3. Cannibalization risks

| Risk                                                      | URLs                                                                      | Mitigation                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **High** — “HTTP / typed fetch client for TanStack Query” | `/`, `/guide/why`, `/guide/introduction`, `/guide/tanstack-query`         | Primary = `/`. Why = mental model. TanStack Query = integration how-to. Introduction = docs entry. |
| **Medium** — axios alternative                            | `/guide/comparison`, `/guide/migrate`, `/blog/react-axios-tanstack-fetch` | Comparison = matrix. Migrate = CLI/how-to. Blog = React narrative.                                 |
| **Medium** — Next SSR cookies                             | `/guide/ssr`, `/blog/nextjs-fetch-tanstack-fetch`, `/examples/next-ssr`   | Guide = canonical. Blog = long-form. Example = demo.                                               |
| **Medium** — Vue/Nuxt ofetch                              | `/guide/vue`, `/blog/vue-*`, `/blog/nuxt-*`                               | Guide = API. Blogs = commercial investigation.                                                     |
| **Low** — SSE                                             | `/guide/sse` vs blog SSE sections                                         | Guide owns SEO; blogs link to guide.                                                               |
| **Low** — Refresh token                                   | `/recipes/refresh-token` vs comparison/plugins mentions                   | Recipe owns problem keywords.                                                                      |

**Rule:** One primary keyword per URL (see `keyword-research.json` → `page_primary_keyword_map`). Closely related phrases are secondaries only.

---

## 4. Missing topics (justified gaps)

Create or deepen only where product capability + distinct intent exist:

1. **EventSource cannot set Authorization** → fetch-based SSE tutorial
2. **SSE reconnect / Last-Event-ID / lost events** → `sse-resume` recipe or SSE guide section
3. **SSE + refresh token** → recipe bridging `/guide/sse` + `/recipes/refresh-token`
4. **SSE events → `queryClient.setQueryData` / invalidate** → section on SSE or TanStack Query guide
5. **Typed URL params / request bodies walkthrough** → getting-started expansion or short guide
6. **Migration checklist + CLI limitations + doctor** → migrate deepen

**Do not create:**

- Generic “best TypeScript HTTP client” ranking pages
- Duplicate framework landing pages for every keyword variant
- Official-Query-doc clones (hydration, queryFn basics)
- Thin axios-vs-fetch opinion pieces without createFetch call-site evidence

---

## 5. Competing page types (SERP landscape — observed)

| Intent class            | Typical competitors               | tanstack-fetch angle                                       |
| ----------------------- | --------------------------------- | ---------------------------------------------------------- |
| Query HTTP client       | Official Query docs; DIY adapters | Ready-made queryFn contract (data / throw / signal)        |
| Axios alternatives      | ky, ofetch, undici, blog roundups | Query-shaped alternative — not universal axios replacement |
| Typed fetch             | Many small wrappers               | Typed errors + Query + SSR/SSE optional entries            |
| SSE auth                | EventSource SO answers            | fetch SSE with headers + reconnect                         |
| Next cookies + prefetch | Next blogs; Query discussions     | `ssr-forward` plugin                                       |
| Token refresh           | Axios interceptor tutorials       | Built-in single-flight refresh-token                       |

---

## 6. Hypotheses vs facts

### Facts (repo / site audit)

- VitePress docs with guides, recipes, blogs, API, examples.
- Comparison and migrate pages exist and map axios/ky/ofetch.
- SSR, SSE, refresh-token, rate-limit are documented capabilities.
- Framework blogs exist for major stacks.
- Sitemaps and robots are published.
- No GSC data in repository.

### Hypotheses (unverified)

- Problem-intent SSE/auth queries are more achievable than broad “TypeScript HTTP client”.
- Query-qualified commercial queries convert better than generic axios-alternative queries.
- Home already has some visibility for Query-shaped fetch language (sample SERP only).
- Official Query docs will continue to own generic queryFn / hydration queries.

---

## 7. Technical SEO notes (research only — no production changes)

| Item               | Observation                     | Suggested later work (needs approval)                      |
| ------------------ | ------------------------------- | ---------------------------------------------------------- |
| Dual sitemaps      | Both referenced in robots       | Confirm both remain intentional; avoid duplicate URL noise |
| Brand disclaimer   | Needed near TanStack naming     | Footer / intro callout consistency                         |
| Internal links     | Framework blogs ↔ guides uneven | See `internal-linking-plan.md`                             |
| Recipe SEO titles  | Accurate but feature-named      | Align H1/description to problem queries                    |
| Thin release notes | Some short version blogs        | Keep as changelog; do not target non-brand keywords        |

---

## 8. Summary verdict

The site already has **strong topical coverage** for a young independent library. The main opportunity is **not** dozens of new pages — it is:

1. Resolving **cannibalization** with one primary keyword per URL
2. Deepening **problem-solving** content where capabilities already exist (SSE auth/resume, refresh single-flight, SSR cookies, migrate CLI honesty)
3. Improving **internal discovery** between home → guides → recipes → framework blogs

Create at most a **small** set of new recipes (EventSource auth, SSE resume) after optimizing existing hubs.
