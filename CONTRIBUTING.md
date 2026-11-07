# Contributing

Thanks for helping out! Bug reports, docs fixes and PRs are all welcome.

## Setup

```bash
git clone https://github.com/mohamadgarmabi/tanstack-fetch.git
cd tanstack-fetch
npm install
```

## Before you open a PR

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run size   # the HTTP core must stay small
```

- Add or update a test in `test/` for any behavior change.
- Add a line to `CHANGELOG.md` under the next version.
- Docs live in `website/` (`npm run docs:dev`).
- Keep PRs focused: one fix or feature per PR.

## Where to start

- Issues labeled [`good first issue`](https://github.com/mohamadgarmabi/tanstack-fetch/labels/good%20first%20issue) or [`help wanted`](https://github.com/mohamadgarmabi/tanstack-fetch/labels/help%20wanted).
- Questions and ideas: [Discussions](https://github.com/mohamadgarmabi/tanstack-fetch/discussions).

By contributing you agree your work is released under the [MIT License](./LICENSE) and you follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
