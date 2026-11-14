---
name: find-bug
description: Scan the whole tanstack-fetch repo for real bugs (logic, edge cases, races, leaks, broken config) and report them ranked. Changes nothing. Usage: /find-bug [path or area]
argument-hint: "[path or area, default: whole repo]"
---

Find bugs in this repo. Scope: $ARGUMENTS (if empty: `src/`, `test/`, `examples/`, `example/`, `scripts/`, `website/.vitepress/`, root config like `package.json`, `tsup.config.ts`). Skip `dist/`, `node_modules/`, lockfiles and generated JSON data.

## Steps

1. Run the checks and keep their output:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
2. Split the scope into areas (for `src/`: core client + `utils/`, `react/` `vue/` `solid/` `svelte/` `angular/` adapters, `trpc/`, `devtools/`, `cli/`; then website/config; then examples). Use parallel Explore or general-purpose agents, one per area, when the scope is the whole repo. Each agent reads the code fully and returns candidate bugs with file:line and a concrete failure scenario.
3. Look for: wrong logic, unhandled edge cases (empty/null, aborted signal, non-JSON bodies, retries, timeouts), race conditions and stale state in hooks/subscriptions, listeners/sockets/streams never closed, error types that leak or get swallowed, SSR/browser-only APIs used on the server, path/URL/base handling, export map vs. built files mismatch, config that only works on one deploy target.
4. Verify every candidate yourself: read the code around it and its callers, and write a quick vitest or node snippet in the scratchpad when cheap. Drop anything you cannot back with a concrete scenario. No style nits.
5. Do not edit project files.

## Report

Start with the check results (pass/fail, first errors). Then the findings, most severe first:

`N. file:line — one-sentence bug`
`   Scenario: input/state → wrong result`
`   Fix: one line`
`   Confidence: confirmed (reproduced) | likely`

End with what was not checked.
