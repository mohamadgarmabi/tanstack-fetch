---
title: Agent skill
description: Install the tanstack-fetch Cursor / Agent Skills package so coding agents follow the correct createFetch patterns.
---

# Agent skill

Teach Cursor, Claude Code, Codex, and other Agent Skills–compatible tools how to use **tanstack-fetch** correctly (shared client, Query `signal`, typed path params, SSE, SSR, plugins).

## Install (one command)

Pick your runner — same skill either way:

<InstallTabs kind="skills" />

Global (all projects on this machine):

<InstallTabs kind="skills" global />

From this docs site (direct skill URL):

<InstallTabs
  kind="skills"
  skill="https://mohamadgarmabi.github.io/tanstack-fetch/skills/tanstack-fetch"
/>

## What you get

Skill folder: [`.agents/skills/tanstack-fetch`](https://github.com/mohamadgarmabi/tanstack-fetch/tree/main/.agents/skills/tanstack-fetch)

- `SKILL.md` — install, entry points, shared client, Query, errors, SSE, SSR, upload, tRPC
- `references/` — entry sizes + status-handler map

After install, invoke with `/tanstack-fetch` or let the agent pick it up when you work on HTTP / Query / SSE.

## Manual install

```bash
mkdir -p .agents/skills
curl -fsSL https://codeload.github.com/mohamadgarmabi/tanstack-fetch/tar.gz/main \
  | tar -xz --strip-components=3 -C .agents/skills \
    '*/.agents/skills/tanstack-fetch'
```

Or copy from the repo:

```bash
cp -R path/to/tanstack-fetch/.agents/skills/tanstack-fetch .agents/skills/
```

Cursor also discovers `.cursor/skills/`, `~/.agents/skills/`, and `~/.cursor/skills/`.

## Verify

::: code-group

```bash [npm]
npx skills list
```

```bash [pnpm]
pnpm dlx skills list
```

```bash [yarn]
yarn dlx skills list
```

```bash [bun]
bunx skills list
```

:::

You should see `tanstack-fetch`. Open **Customize → Skills** in Cursor to confirm.

## Related

- [Getting started](/guide/getting-started)
- [Raw skill file](/skills/tanstack-fetch/SKILL.md)
- [LLM context (`llms.txt`)](/llms.txt)
- [Agent Skills spec](https://agentskills.io/)
- [`npx skills` CLI](https://github.com/vercel-labs/skills)
