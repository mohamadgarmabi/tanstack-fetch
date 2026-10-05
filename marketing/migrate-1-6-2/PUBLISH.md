# Publish checklist — migrate article

## Assets

| File | Use |
| --- | --- |
| `cover.jpg` | Medium, Dev.to, Hashnode, Virgool cover (16:9) |
| `medium-dev-hashnode.md` | English long-form (Medium / Dev.to / Hashnode) |
| `virgool.md` | Persian (Virgool) |
| `reddit.md` | Titles + body for Reddit |

Site mirror of cover: `website/public/images/migrate-cover.jpg`

---

## Suggested titles

| Platform | Title |
| --- | --- |
| Medium / Hashnode | Migrate axios, ky, ofetch, or fetch to tanstack-fetch in one command |
| Dev.to | Migrate axios / ky / ofetch / fetch → tanstack-fetch (CLI for TanStack Query) |
| Virgool | مهاجرت از axios، ky، ofetch یا fetch به tanstack-fetch با یک دستور |
| Reddit | see `reddit.md` |

---

## Tags

**Dev.to / Hashnode:** `javascript`, `typescript`, `react`, `tanstack`, `webdev`  
Optional: `nextjs`, `vue`, `nuxt`, `axios`

**Medium:** JavaScript, TypeScript, React, Web Development, Open Source

**Virgool:** جاوااسکریپت، تایپ‌اسکریپت، ری‌اکت، فرانت‌اند، اوپن‌سورس

---

## Canonical / links to include

- Site blog: https://mohamadgarmabi.github.io/tanstack-fetch/blog/tanstack-fetch-1-6-2
- Migrate guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate
- npm: https://www.npmjs.com/package/tanstack-fetch
- GitHub: https://github.com/mohamadgarmabi/tanstack-fetch

For Medium / Dev / Hashnode, set `canonical_url` to the **site blog** (or the migrate guide) so duplicates consolidate.

---

## Platform tips

| Platform | Tip |
| --- | --- |
| **Medium** | Paste markdown; upload `cover.jpg` as story image; add subtitle |
| **Dev.to** | Front matter: `cover_image`, `tags`, `canonical_url` |
| **Hashnode** | Cover + tags; enable “Disable comments” only if you want |
| **Virgool** | Paste `virgool.md`; upload cover; RTL is automatic |
| **Reddit** | Text post, not link-only; one CTA question at the end |

### Dev.to front matter example

```yaml
---
title: Migrate axios / ky / ofetch / fetch → tanstack-fetch (CLI for TanStack Query)
published: true
description: Scan and rewrite HTTP call sites for TanStack Query with tanstack-fetch migrate.
tags: javascript, typescript, react, tanstack, webdev
cover_image: ./cover.jpg
canonical_url: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate
---
```
