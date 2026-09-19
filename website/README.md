# Docs site (VitePress)

Source for https://mohamadgarmabi.github.io/tanstack-fetch/

```bash
npm run docs:dev      # from repo root
npm run docs:build
```

## GitHub Pages (one-time)

Hard reload must show this VitePress site — **not** the root `README.md`.

If hard reload shows the README, Pages is pointed at `main`. Fix:

1. [Settings → Pages](https://github.com/mohamadgarmabi/tanstack-fetch/settings/pages)
2. **Source:** either
   - **GitHub Actions**, or
   - **Deploy from a branch** → **`gh-pages`** / **`/` (root)**
3. Do **not** choose `main` (that publishes `README.md`)
4. Push to `main` or re-run **Deploy Docs**
