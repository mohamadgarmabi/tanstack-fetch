import { defineConfig, type HeadConfig } from 'vitepress'

const SITE_URL = 'https://mohamadgarmabi.github.io/tanstack-fetch'
const SITE_NAME = 'tanstack-fetch'
const AUTHOR_NAME = 'Mohammad Garmabi'
const AUTHOR_EMAIL = 'mwmdgmb@gmail.com'
const AUTHOR_URL = `${SITE_URL}/author`
const GITHUB_URL = 'https://github.com/mohamadgarmabi/tanstack-fetch'
const NPM_URL = 'https://www.npmjs.com/package/tanstack-fetch'
const OG_IMAGE = `${SITE_URL}/images/docs-og-banner.png`
const DEFAULT_DESCRIPTION =
  'tanstack-fetch by Mohammad Garmabi — typed Fetch client for TanStack Query. Tiny HTTP core, SSR, SSE, upload, and tRPC. Axios alternative for React Query.'

const KEYWORDS = [
  'tanstack-fetch',
  'Mohammad Garmabi',
  'mohammad garmabi',
  'TanStack Query',
  'react-query',
  '@tanstack/react-query',
  'fetch client',
  'typed fetch',
  'axios alternative',
  'TypeScript',
  'SSR',
  'SSE',
  'tRPC',
  'Next.js',
  'createFetch',
].join(', ')

const toAbsoluteUrl = (page: string) => {
  const path = page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
  const normalized = path === 'index' || path === '' ? '' : path.replace(/\/$/, '')
  return normalized ? `${SITE_URL}/${normalized}` : `${SITE_URL}/`
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
      softwareVersion: '1.1.0',
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
      sameAs: [
        'https://github.com/mohamadgarmabi',
        NPM_URL,
        AUTHOR_URL,
      ],
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
  base: '/tanstack-fetch/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  srcExclude: ['**/README.md'],
  metaChunk: true,

  sitemap: {
    hostname: `${SITE_URL}/`,
  },

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/tanstack-fetch/images/logo.jpg' }],
    ['link', { rel: 'apple-touch-icon', href: '/tanstack-fetch/images/logo.jpg' }],
    ['link', { rel: 'author', href: '/tanstack-fetch/author' }],
    ['link', { rel: 'me', href: 'https://github.com/mohamadgarmabi' }],
    ['link', { rel: 'me', href: `mailto:${AUTHOR_EMAIL}` }],
    ['meta', { name: 'theme-color', content: '#050505' }],
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
    ['meta', { property: 'og:image:alt', content: `${SITE_NAME} — typed Fetch for TanStack Query by ${AUTHOR_NAME}` }],
    ['meta', { property: 'og:image:width', content: '1456' }],
    ['meta', { property: 'og:image:height', content: '816' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
    ['meta', { name: 'twitter:image:alt', content: `${SITE_NAME} by ${AUTHOR_NAME}` }],
    // Optional: add your Search Console token later
    // ['meta', { name: 'google-site-verification', content: 'YOUR_TOKEN' }],
  ],

  transformPageData: (pageData) => {
    const title = pageData.frontmatter.title
      ? String(pageData.frontmatter.title)
      : pageData.title || SITE_NAME
    const description = pageData.frontmatter.description
      ? String(pageData.frontmatter.description)
      : pageData.description || DEFAULT_DESCRIPTION
    const pageUrl = toAbsoluteUrl(pageData.relativePath)
    const fullTitle = `${title} | ${SITE_NAME} by ${AUTHOR_NAME}`

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
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/create-fetch' },
      { text: 'Recipes', link: '/recipes/refresh-token' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Packages', link: '/packages' },
      { text: 'Author', link: '/author' },
      {
        text: 'v1.1',
        items: [
          { text: 'Changelog', link: `${GITHUB_URL}/blob/main/CHANGELOG.md` },
          { text: 'npm', link: NPM_URL },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is tanstack-fetch?', link: '/guide/introduction' },
            { text: 'Getting started', link: '/guide/getting-started' },
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
            { text: 'SSR & Next.js', link: '/guide/ssr' },
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
            { text: 'tRPC helpers', link: '/api/trpc' },
            { text: 'Plugins', link: '/api/plugins' },
          ],
        },
      ],
      '/recipes/': [
        {
          text: 'Recipes',
          items: [
            { text: 'Refresh token on 401', link: '/recipes/refresh-token' },
            { text: 'tRPC + Router / Start', link: '/recipes/trpc' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [{ text: 'Overview', link: '/examples/' }],
        },
      ],
    },
  },
})

export default config
