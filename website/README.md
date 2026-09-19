# tanstack-fetch docs (VitePress)

Documentation site for **tanstack-fetch**, published to GitHub Pages.

**Live URL (after deploy):** https://mohamadgarmabi.github.io/tanstack-fetch/

## Local

```bash
cd website
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

`base` is `/tanstack-fetch/` for project Pages.

## GitHub Pages setup

1. Repo **Settings → Pages → Build and deployment → Source**: **GitHub Actions** (not “Deploy from a branch”).
2. Push to `main` (or run the **Deploy Docs** workflow manually).
3. Site appears at `https://mohamadgarmabi.github.io/tanstack-fetch/`.


## SEO / Google Search

After the site is live:

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://mohamadgarmabi.github.io/tanstack-fetch/`
3. Verify (HTML tag or DNS). Paste the token into `website/.vitepress/config.ts` → `google-site-verification` meta
4. Submit sitemap: `https://mohamadgarmabi.github.io/tanstack-fetch/sitemap.xml`

Author page (indexed for name searches): `/author` — **Mohammad Garmabi**
