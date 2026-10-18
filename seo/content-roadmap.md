# Content roadmap — tanstack-fetch (8 weeks)

**Goal:** Attract developers who do **not** already know tanstack-fetch, via high-intent, product-true queries.  
**Constraint:** Prefer optimizing existing URLs. Create new pages only for distinct problem intents.  
**Positioning:** Independent project by Mohammad Garmabi — not an official TanStack package.  
**Metrics policy:** Search volume/KD unknown. Success metrics use proxies (GitHub stars referrals, npm installs, docs engagement) until GSC is connected.

**Approval gate:** No production doc/metadata changes until this plan is approved.

---

## Week 1–2 — P0 foundations (optimize existing)

### W1. Home `/` — primary commercial page

| Field                  | Value                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary keyword**    | HTTP client for TanStack Query                                                                                                                                  |
| **Secondary**          | TanStack Query HTTP client TypeScript; typed fetch client TypeScript                                                                                            |
| **Audience**           | TS/React (and multi-framework) developers evaluating a Query-side fetch layer                                                                                   |
| **Intent**             | commercial_investigation                                                                                                                                        |
| **Outline**            | Keep hero brand-first; tighten “independent, not official TanStack”; one clear CTA to getting-started; link Why + Comparison + Migrate; avoid new hero sections |
| **Internal links out** | `/guide/getting-started`, `/guide/why`, `/guide/comparison`, `/guide/tanstack-query`, `/guide/migrate`                                                          |
| **Success metrics**    | GSC impressions/CTR for branded + Query-client queries when available; CTA click to getting-started (unknown until instrumented)                                |

### W1. `/guide/comparison` — alternatives hub

| Field               | Value                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Primary keyword** | Axios alternative for TanStack Query                                                                                 |
| **Secondary**       | ofetch vs axios; ky vs axios (as matrix rows, not claims of universal superiority)                                   |
| **Audience**        | Teams comparing axios/ky/ofetch for Query apps                                                                       |
| **Intent**          | commercial_investigation                                                                                             |
| **Outline**         | Keep honest matrix; add Query call-site before/after; “when to keep axios”; link migrate + refresh-token + SSR + SSE |
| **Internal links**  | → migrate, why, ssr, sse, refresh-token, React blog                                                                  |
| **Success metrics** | Engagement time; clicks to migrate                                                                                   |

### W2. `/guide/migrate` — migration + CLI

| Field               | Value                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary keyword** | migrate from axios to fetch                                                                                                                           |
| **Secondary**       | replace axios with fetch CLI; migrate ofetch/ky                                                                                                       |
| **Audience**        | Devs ready to change call sites                                                                                                                       |
| **Intent**          | commercial_investigation / solution_seeking                                                                                                           |
| **Outline**         | Checklist; dry-run; supported transforms; limitations; scaffold notes; doctor CLI cross-link; clarify destination is createFetch, not raw fetch alone |
| **Internal links**  | → comparison, getting-started, openapi, 1.6.3 / 1.7.0 blogs                                                                                           |
| **Success metrics** | CLI usage mentions; migrate page → install path                                                                                                       |

### W2. `/guide/tanstack-query` + `/guide/why`

| Field                        | Value                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Primary (tanstack-query)** | TanStack Query custom queryFn fetch                                                                               |
| **Primary (why)**            | TanStack Query fetch wrapper (mental model)                                                                       |
| **Secondary**                | AbortSignal / AbortController with Query                                                                          |
| **Outline**                  | Explicit signal + throw FetchError sections; link home as commercial parent; do not duplicate official Query docs |
| **Success metrics**          | Assisted conversions to getting-started                                                                           |

---

## Week 3–4 — P1 problem content (SSR + auth errors)

### W3. `/guide/ssr` + `/blog/nextjs-fetch-tanstack-fetch`

| Field               | Value                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Primary (ssr)**   | forward cookies in Next.js server requests                                                                                          |
| **Secondary**       | Next.js SSR API client cookies; Nuxt server auth fetch                                                                              |
| **Audience**        | Next/Nuxt + Query apps leaking auth on prefetch                                                                                     |
| **Intent**          | informational                                                                                                                       |
| **Outline**         | Lead with cookie-forward problem; `ssr-forward` solution; absolute baseUrl; link official Query hydration docs; Nuxt parity section |
| **Internal links**  | → Next blog, Nuxt blog, tanstack-query, examples/next-ssr, examples/nuxt-ssr                                                        |
| **Success metrics** | Organic landings on SSR URLs (when GSC available); example repo clones (unknown)                                                    |

### W3–W4. `/recipes/refresh-token` + `/guide/errors` + `/guide/configuration`

| Field                 | Value                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| **Primary (refresh)** | prevent multiple refresh token requests                                                                   |
| **Secondary**         | fetch wrapper 401 token refresh; Axios refresh interceptor alternative                                    |
| **Primary (errors)**  | TypeScript fetch error handling                                                                           |
| **Primary (config)**  | handle 403 and 401 separately                                                                             |
| **Outline**           | Problem-phrased H2s; axios before/after; single-flight explanation; link plugins; 429 → rate-limit recipe |
| **Success metrics**   | Recipe engagement; reduced “how do I…” GitHub issues (qualitative)                                        |

### W4. `/guide/errors` expansion

| Field              | Value                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **Outline**        | Raw fetch `!res.ok` vs FetchError; Query `isError` + `isFetchError`; status handlers pointer |
| **Internal links** | → api/errors, configuration, tanstack-query                                                  |

---

## Week 5–6 — P1 SSE cluster (highest new-content value)

### W5. Optimize `/guide/sse` (required before new pages)

| Field               | Value                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Primary keyword** | TanStack Query SSE                                                                          |
| **Secondary**       | SSE with React Query; handle SSE events with queryClient; SSE with TypeScript fetch         |
| **Outline**         | Why not EventSource for auth; useSse; queryClient.setQueryData examples; link recipes below |
| **Internal links**  | → plugins, tanstack-query, React blog SSE section, refresh-token                            |

### W5–W6. **New (if approved):** `/recipes/eventsource-auth-headers`

| Field               | Value                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Primary keyword** | EventSource authentication headers                                                                              |
| **Secondary**       | SSE authentication token refresh; SSE with TypeScript fetch                                                     |
| **Audience**        | Devs blocked by EventSource header limits                                                                       |
| **Intent**          | informational                                                                                                   |
| **Outline**         | Problem → why EventSource fails → fetch SSE → Authorization → optional refresh → Query cache updates → pitfalls |
| **Internal links**  | → `/guide/sse`, `/recipes/refresh-token`, `/guide/tanstack-query`, getting-started                              |
| **Success metrics** | Impressions/CTR on problem queries; inbound from SO/GitHub (qualitative)                                        |
| **Alternative**     | If new page not approved, add equivalent section under `/guide/sse` only                                        |

### W6. **New (if approved):** `/recipes/sse-resume` **or** deepen SSE guide

| Field               | Value                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Primary keyword** | SSE reconnect Last-Event-ID                                                                        |
| **Secondary**       | resume SSE stream after reconnect; automatic reconnection                                          |
| **Outline**         | Lost events; Last-Event-ID; `sse-resume` plugin; auth on reconnect; cancellation                   |
| **Internal links**  | → sse, plugins, eventsource recipe                                                                 |
| **Note**            | Prefer **one** deep destination — do not ship both a bloated SSE guide and a thin duplicate recipe |

### W6. Optional short typed-params content

| Field                                                                           | Value                                                          |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Primary**                                                                     | type safe URL parameters TypeScript                            |
| **Preferred action**                                                            | Expand `/guide/getting-started` + `/api/fetch-client` examples |
| **Create `/guide/typed-params` only if** getting-started would become unfocused |

---

## Week 7 — P2 framework discoverability (no new landings)

| Task                | Target URLs                                                     | Intent                     |
| ------------------- | --------------------------------------------------------------- | -------------------------- |
| Cross-link hub      | `/guide/react` ↔ React blog; vue ↔ Vue/Nuxt blogs; etc.         | informational / commercial |
| Clarify primary URL | Blog = commercial narrative; Guide = API reference              | cannibalization control    |
| TanStack Start blog | Keep independent-project disclaimer near TanStack product names | navigational / commercial  |
| Rate-limit recipe   | Align title/H2 to “HTTP 429 Retry-After TypeScript”             | informational              |

**Do not:** Create Angular/Vue/Solid/Svelte keyword microsites.

---

## Week 8 — P2 CLI honesty + measurement + brand polish

| Task             | Detail                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Migrate CLI docs | Dry-run, limitations, doctor scope, checklist                                               |
| Brand            | Consistent “tanstack-fetch by Mohammad Garmabi”; npm + GitHub links; independent disclaimer |
| Measurement      | Connect GSC if possible; annotate `keyword-research.json` with real clicks/impressions      |
| Review           | Re-score clusters using GSC; kill underperforming drafts; avoid thin new posts              |

---

## Prioritized page plan (one primary keyword each)

| Priority | URL                                 | Action                          | Primary keyword                            |
| -------- | ----------------------------------- | ------------------------------- | ------------------------------------------ |
| P0       | `/`                                 | optimize_existing               | HTTP client for TanStack Query             |
| P0       | `/guide/comparison`                 | optimize_existing               | Axios alternative for TanStack Query       |
| P0       | `/guide/migrate`                    | optimize_existing               | migrate from axios to fetch                |
| P0       | `/guide/tanstack-query`             | optimize_existing               | TanStack Query custom queryFn fetch        |
| P0       | `/guide/why`                        | optimize_existing               | TanStack Query fetch wrapper               |
| P1       | `/guide/ssr`                        | optimize_existing               | forward cookies in Next.js server requests |
| P1       | `/guide/sse`                        | optimize_existing               | TanStack Query SSE                         |
| P1       | `/recipes/refresh-token`            | optimize_existing               | prevent multiple refresh token requests    |
| P1       | `/recipes/eventsource-auth-headers` | create_new (optional)           | EventSource authentication headers         |
| P1       | `/recipes/sse-resume`               | create_new **or** fold into SSE | SSE reconnect Last-Event-ID                |
| P1       | `/blog/nextjs-fetch-tanstack-fetch` | optimize_existing               | Next.js fetch client with authentication   |
| P1       | `/blog/react-axios-tanstack-fetch`  | optimize_existing               | Axios alternative for React                |
| P2       | `/guide/errors`                     | optimize_existing               | TypeScript fetch error handling            |
| P2       | `/recipes/rate-limit`               | optimize_existing               | HTTP 429 Retry-After TypeScript            |
| P2       | `/guide/plugins`                    | optimize_existing               | TypeScript API client with interceptors    |

---

## Explicit non-goals (weeks 1–8)

- Hundreds of thin SEO pages or keyword-stuffed articles
- Competing with official TanStack Query for core Query concepts
- Claiming superiority over axios/ky/ofetch without evidence
- Changing package code, production URLs, or metadata before approval
- Invented traffic forecasts

---

## Success metrics (until GSC)

| Proxy                  | How to use                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Docs CTA paths         | Home → getting-started → install                                                           |
| GitHub traffic sources | Referrals from docs (when available)                                                       |
| Qualitative            | Issue/discussion phrases matching target keywords                                          |
| After GSC              | clicks, impressions, CTR, average position per URL — fill nulls in `keyword-research.json` |

**Hypothesis (unverified):** Problem-intent SSE and SSR cookie pages will outperform broad “TypeScript HTTP client” chasing for a young independent library.
