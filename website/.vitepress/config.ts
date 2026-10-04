import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type HeadConfig, type SiteConfig } from 'vitepress'

const SITE_URL = 'https://mohamadgarmabi.github.io/tanstack-fetch'
const SITE_NAME = 'tanstack-fetch'
const AUTHOR_NAME = 'Mohammad Garmabi'
const AUTHOR_EMAIL = 'mwmdgmb@gmail.com'
const AUTHOR_URL = `${SITE_URL}/author`
const GITHUB_URL = 'https://github.com/mohamadgarmabi/tanstack-fetch'
const LINKEDIN_URL = 'https://www.linkedin.com/in/mohammad-garmabi/'
const GITHUB_PROFILE_URL = 'https://github.com/mohamadgarmabi'
const NPM_URL = 'https://www.npmjs.com/package/tanstack-fetch'
const OG_IMAGE = `${SITE_URL}/images/docs-og-banner.png`
const DEFAULT_DESCRIPTION =
  'Typed Fetch client designed for TanStack Query. Tiny HTTP core with SSR, SSE, React, Vue and Nuxt support.'
const HOME_TITLE =
  'tanstack-fetch by Mohammad Garmabi — Typed Fetch Client for TanStack Query'

const KEYWORDS = [
  'tanstack-fetch',
  'Mohammad Garmabi',
  'mohammad garmabi',
  'TanStack Query',
  'react-query',
  '@tanstack/react-query',
  '@tanstack/vue-query',
  'fetch client',
  'typed fetch',
  'axios alternative',
  'TypeScript',
  'SSR',
  'SSE',
  'tRPC',
  'Next.js',
  'Vue',
  'Nuxt',
  'createFetch',
  'Mohammad Garmabi LinkedIn',
  'mohammad garmabi linkedin',
].join(', ')

const toAbsoluteUrl = (page: string) => {
  const path = page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
  const normalized = path === 'index' || path === '' ? '' : path.replace(/\/$/, '')
  return normalized ? `${SITE_URL}/${normalized}` : `${SITE_URL}/`
}

/** Minimal urlset Google Search Console parses reliably (no unused namespaces). */
const writeGoogleFriendlySitemap = (siteConfig: SiteConfig) => {
  const today = new Date().toISOString().slice(0, 10)
  const home = `${SITE_URL}/`

  const urls = siteConfig.pages
    .map((page) => {
      const rewritten = siteConfig.rewrites.map[page] || page
      if (rewritten.includes('/public/') || rewritten.includes('/skills/')) return null
      if (rewritten.includes('404')) return null
      return toAbsoluteUrl(rewritten)
    })
    .filter((url): url is string => Boolean(url))

  const unique = [...new Set(urls)].sort((left, right) => {
    if (left === home) return -1
    if (right === home) return 1
    return left.localeCompare(right)
  })

  const body = unique
    .map(
      (loc) =>
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
    )
    .join('\n')

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`

  // Keep sitemap.xml for convention; also emit an alternate name for a clean GSC submit.
  for (const fileName of ['sitemap.xml', 'sitemap-pages.xml']) {
    writeFileSync(join(siteConfig.outDir, fileName), xml, 'utf8')
  }
}

const buildJsonLd = (pageUrl: string, title: string, description: string) => {
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher: { '@id': `${SITE_URL}/#person` },
      inLanguage: 'en-US',
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#software` },
      author: { '@id': `${SITE_URL}/#person` },
      creator: { '@id': `${SITE_URL}/#person` },
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: SITE_NAME,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      description: DEFAULT_DESCRIPTION,
      url: `${SITE_URL}/`,
      downloadUrl: NPM_URL,
      softwareVersion: '1.6.1',
      license: 'https://opensource.org/licenses/MIT',
      codeRepository: GITHUB_URL,
      programmingLanguage: ['TypeScript', 'JavaScript'],
      author: { '@id': `${SITE_URL}/#person` },
      creator: { '@id': `${SITE_URL}/#person` },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      email: AUTHOR_EMAIL,
      jobTitle: 'Software Engineer',
      sameAs: [GITHUB_PROFILE_URL, LINKEDIN_URL, NPM_URL, AUTHOR_URL],
    },
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

const config = defineConfig({
  title: SITE_NAME,
  titleTemplate: `:title | ${SITE_NAME} by ${AUTHOR_NAME}`,
  description: DEFAULT_DESCRIPTION,
  lang: 'en-US',
  appearance: 'force-dark',
  base: '/tanstack-fetch/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  // `public/**` is static assets only — never treat skill markdown as site pages.
  srcExclude: ['**/README.md', 'public/**'],
  metaChunk: true,

  // Built-in sitemap writer races buildEnd (async stream). We emit sitemap.xml ourselves.
  buildEnd: (siteConfig) => {
    writeGoogleFriendlySitemap(siteConfig)
  },

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/tanstack-fetch/images/logo.jpg' }],
    ['link', { rel: 'apple-touch-icon', href: '/tanstack-fetch/images/logo.jpg' }],
    ['link', { rel: 'author', href: '/tanstack-fetch/author' }],
    ['link', { rel: 'me', href: GITHUB_PROFILE_URL }],
    ['link', { rel: 'me', href: LINKEDIN_URL }],
    ['link', { rel: 'me', href: `mailto:${AUTHOR_EMAIL}` }],
    ['meta', { name: 'theme-color', content: '#09090b' }],
    ['meta', { name: 'msapplication-TileColor', content: '#f05a12' }],
    ['meta', { name: 'author', content: AUTHOR_NAME }],
    ['meta', { name: 'creator', content: AUTHOR_NAME }],
    ['meta', { name: 'publisher', content: AUTHOR_NAME }],
    ['meta', { name: 'keywords', content: KEYWORDS }],
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' }],
    ['meta', { name: 'googlebot', content: 'index, follow' }],
    ['meta', { name: 'application-name', content: SITE_NAME }],
    ['meta', { property: 'og:site_name', content: `${SITE_NAME} by ${AUTHOR_NAME}` }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    [
      'meta',
      {
        property: 'og:image:alt',
        content: `${SITE_NAME} — typed Fetch for TanStack Query by ${AUTHOR_NAME}`,
      },
    ],
    ['meta', { property: 'og:image:width', content: '1456' }],
    ['meta', { property: 'og:image:height', content: '816' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
    ['meta', { name: 'twitter:image:alt', content: `${SITE_NAME} by ${AUTHOR_NAME}` }],
    [
      'meta',
      {
        name: 'google-site-verification',
        content: 'WS1yizmm8hIogpaEDEMBMNdoZvxMUEb8-CK_3q2VE60',
      },
    ],
  ],

  transformPageData: (pageData) => {
    const isHome = pageData.relativePath === 'index.md'
    const title = pageData.frontmatter.title
      ? String(pageData.frontmatter.title)
      : pageData.title || (isHome ? HOME_TITLE : SITE_NAME)
    const description = pageData.frontmatter.description
      ? String(pageData.frontmatter.description)
      : pageData.description || DEFAULT_DESCRIPTION
    const pageUrl = toAbsoluteUrl(pageData.relativePath)
    // Keep exact SEO titles when titleTemplate: false (home, docs hub, key posts).
    const useExactTitle = isHome || pageData.frontmatter.titleTemplate === false
    const fullTitle = useExactTitle
      ? title
      : `${title} | ${SITE_NAME} by ${AUTHOR_NAME}`

    pageData.frontmatter.head ??= []
    const head = pageData.frontmatter.head as HeadConfig[]

    head.push(
      ['link', { rel: 'canonical', href: pageUrl }],
      ['meta', { name: 'author', content: AUTHOR_NAME }],
      ['meta', { name: 'description', content: description }],
      ['meta', { property: 'og:title', content: fullTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: pageUrl }],
      ['meta', { name: 'twitter:title', content: fullTitle }],
      ['meta', { name: 'twitter:description', content: description }],
      [
        'script',
        { type: 'application/ld+json' },
        JSON.stringify(buildJsonLd(pageUrl, fullTitle, description)),
      ],
    )
  },

  themeConfig: {
    logo: { src: '/images/logo.jpg', alt: 'tanstack-fetch' },
    siteTitle: SITE_NAME,
    search: { provider: 'local' },
    outline: [2, 3],
    socialLinks: [
      { icon: 'github', link: GITHUB_URL },
      { icon: 'linkedin', link: LINKEDIN_URL },
      { icon: 'npm', link: NPM_URL },
    ],
    editLink: {
      pattern: 'https://github.com/mohamadgarmabi/tanstack-fetch/edit/main/website/:path',
      text: 'Edit this page',
    },
    footer: {
      message: `MIT Licensed · Created by <a href="${AUTHOR_URL}">${AUTHOR_NAME}</a> · Not an official TanStack package`,
      copyright: `Copyright © ${new Date().getFullYear()} ${AUTHOR_NAME}`,
    },
    nav: [
      { text: 'Documentation', link: '/docs', activeMatch: '^/(docs|guide)/' },
      { text: 'API', link: '/api/create-fetch', activeMatch: '/api/' },
      { text: 'Comparison', link: '/guide/comparison' },
      { text: 'Playground', link: '/examples/playground', activeMatch: '/examples/' },
      { text: 'Skill', link: '/guide/skill' },
      { text: 'Blog', link: '/blog/', activeMatch: '/blog/' },
      {
        text: 'More',
        items: [
          { text: 'Recipes', link: '/recipes/refresh-token' },
          { text: 'Examples', link: '/examples/' },
          { text: 'Packages', link: '/packages' },
          { text: 'Author', link: '/author' },
          { text: 'Changelog', link: `${GITHUB_URL}/blob/main/CHANGELOG.md` },
          // Public .txt is not a VitePress route — base is not applied; use absolute URL.
          { text: 'LLM context', link: `${SITE_URL}/llms.txt` },
          { text: 'npm', link: NPM_URL },
        ],
      },
    ],
    sidebar: {
      '/docs/': [
        {
          text: 'Documentation',
          items: [
            { text: 'Docs hub', link: '/docs/' },
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'TanStack Query', link: '/guide/tanstack-query' },
            { text: 'React', link: '/guide/react' },
            { text: 'Vue & Nuxt', link: '/guide/vue' },
            { text: 'SSR', link: '/guide/ssr' },
            { text: 'API reference', link: '/api/create-fetch' },
            { text: 'Blog', link: '/blog/' },
          ],
        },
      ],
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is tanstack-fetch?', link: '/guide/introduction' },
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Agent skill', link: '/guide/skill' },
            { text: 'Why this API?', link: '/guide/why' },
            { text: 'Comparison', link: '/guide/comparison' },
          ],
        },
        {
          text: 'Core',
          items: [
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Errors', link: '/guide/errors' },
            { text: 'TanStack Query', link: '/guide/tanstack-query' },
            { text: 'Plugins & interceptors', link: '/guide/plugins' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'React', link: '/guide/react' },
            { text: 'Vue & Nuxt', link: '/guide/vue' },
            { text: 'SSR (Next.js & Nuxt)', link: '/guide/ssr' },
            { text: 'SSE', link: '/guide/sse' },
            { text: 'Upload', link: '/guide/upload' },
            { text: 'tRPC', link: '/guide/trpc' },
            { text: 'OpenAPI CLI', link: '/guide/openapi' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API reference',
          items: [
            { text: 'createFetch', link: '/api/create-fetch' },
            { text: 'FetchClient', link: '/api/fetch-client' },
            { text: 'Errors', link: '/api/errors' },
            { text: 'React', link: '/api/react' },
            { text: 'Vue', link: '/api/vue' },
            { text: 'tRPC helpers', link: '/api/trpc' },
            { text: 'Plugins', link: '/api/plugins' },
          ],
        },
      ],
      '/recipes/': [
        {
          text: 'Recipes',
          items: [
            { text: 'Refresh token', link: '/recipes/refresh-token' },
            { text: 'Rate limit (429)', link: '/recipes/rate-limit' },
            { text: 'tRPC + Router / Start', link: '/recipes/trpc' },
          ],
        },
      ],
      '/blog/': [
        {
          text: 'Blog',
          items: [
            { text: 'All posts', link: '/blog/' },
            { text: 'tanstack-fetch 1.6.1 — path params', link: '/blog/tanstack-fetch-1-6' },
            { text: 'tanstack-fetch 1.5.0 — Vue & Nuxt', link: '/blog/tanstack-fetch-1-5' },
            { text: 'tanstack-fetch 1.3 → 1.4.2', link: '/blog/tanstack-fetch-1-4' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Live playground', link: '/examples/playground' },
            { text: 'React Query', link: '/examples/react' },
            { text: 'Next.js SSR', link: '/examples/next-ssr' },
            { text: 'Nuxt SSR', link: '/examples/nuxt-ssr' },
            { text: 'Upload', link: '/examples/upload' },
            { text: 'SSE', link: '/examples/sse' },
            { text: 'DevTools', link: '/examples/devtools' },
          ],
        },
      ],
    },
  },

  vite: {
    resolve: {
      alias: {
        'tanstack-fetch/sse': fileURLToPath(new URL('../../src/sse/index.ts', import.meta.url)),
        'tanstack-fetch/react': fileURLToPath(new URL('../../src/react/index.ts', import.meta.url)),
        'tanstack-fetch/vue': fileURLToPath(new URL('../../src/vue/index.ts', import.meta.url)),
        'tanstack-fetch/plugins': fileURLToPath(
          new URL('../../src/plugins/index.ts', import.meta.url),
        ),
        'tanstack-fetch/devtools': fileURLToPath(
          new URL('../../src/devtools/index.ts', import.meta.url),
        ),
        // Only the fetch adapter — full `trpc` barrel pulls `@trpc/client` (not in website deps).
        'tanstack-fetch/trpc': fileURLToPath(
          new URL('../../src/trpc/create-trpc-fetch.ts', import.meta.url),
        ),
        'tanstack-fetch': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
})

export default config
