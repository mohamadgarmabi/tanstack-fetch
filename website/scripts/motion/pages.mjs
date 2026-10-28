#!/usr/bin/env node
/**
 * Page covers: one branded scene per docs page / blog post.
 *
 *   node scripts/motion/pages.mjs           # write pages.json (scene data for scenes.html + render.mjs)
 *   node scripts/motion/pages.mjs --inject  # also add the cover image to each markdown page
 *
 * Headline, chips and accent are curated here; description and the code sample
 * are read from the page itself so the artwork stays in sync with the docs.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))

const A = {
  react: '#61dafb',
  vue: '#42b883',
  nuxt: '#00dc82',
  solid: '#6ea4e0',
  angular: '#f0335a',
  svelte: '#ff5a1f',
  next: '#f5f5f5',
  olive: '#a5b84a',
  amber: '#ffb347',
}

const CLIENT_CODE = [
  "import { createFetch } from 'tanstack-fetch'",
  '',
  "const api = createFetch({ baseUrl: '/api' })",
  '',
  "api.get<User[]>('/users', { signal })",
  "api.post('/users', { body: { name: 'Ada' } })",
]

// md, kicker, white headline, gradient headline, chips, accent, code override?
const PAGES = [
  ['api/fetch-client.md', 'API reference', 'FetchClient', 'methods', ['get', 'post', 'put · patch · delete', 'upload', 'request'], A.amber, [
    "api.get<User[]>('/users', { signal })",
    "api.get('/users/:id', { params: { id: '1' } })",
    "api.post('/users', { body: { name: 'Ada' } })",
    "api.request('PATCH', '/users/:id', { … })",
    "api.upload('/files', { file, onUploadProgress })",
    "api.use('trace', interceptor)",
  ]],
  ['api/react.md', 'API · React', 'React', 'API', ['FetchProvider', 'useFetch', 'useSse'], A.react],
  ['api/vue.md', 'API · Vue & Nuxt', 'Vue', 'API', ['createFetchPlugin', 'useFetch', 'useSse'], A.vue],
  ['docs/index.md', 'Documentation', 'tanstack-fetch', 'docs', ['Guides', 'API', 'Recipes', 'Examples'], A.amber, CLIENT_CODE],
  ['guide/react.md', 'Guide · React', 'React', '+ tanstack-fetch', ['FetchProvider', 'useFetch', 'React Query'], A.react],
  ['guide/vue.md', 'Guide · Vue & Nuxt', 'Vue & Nuxt', '+ tanstack-fetch', ['createFetchPlugin', 'useFetch', 'Vue Query'], A.vue],
  ['guide/solid.md', 'Guide · Solid', 'Solid', '+ tanstack-fetch', ['FetchProvider', 'useSse signals', 'Solid Query'], A.solid],
  ['guide/angular.md', 'Guide · Angular', 'Angular', '+ tanstack-fetch', ['provideFetchClient', 'injectFetch', 'signals'], A.angular],
  ['guide/svelte.md', 'Guide · Svelte', 'Svelte & SvelteKit', '+ tanstack-fetch', ['setFetchClient', 'stores', 'Svelte Query'], A.svelte],
  ['guide/migrate.md', 'Guide · Migrate', 'Migrate from', 'axios · ky · ofetch', ['doctor', 'migrate CLI', 'call-site map'], A.amber],
  ['guide/migrate/checklist.md', 'Guide · Migrate', 'Migration', 'checklist', ['pre-flight', 'CLI rewrites', 'signal', 'verify'], A.olive],
  ['guide/openapi.md', 'Guide · CLI', 'OpenAPI', 'typed client', ['generate', '--spec', '--out'], A.amber],
  ['guide/skill.md', 'Guide · Agents', 'Agent', 'skill', ['Cursor', 'Agent Skills', 'createFetch patterns'], A.olive],
  ['recipes/eventsource-auth-headers.md', 'Recipe', 'EventSource', 'auth headers', ['Authorization', 'tanstack-fetch/sse', 'reconnect'], A.amber],
  ['recipes/rate-limit.md', 'Recipe', 'Rate limit', 'HTTP 429', ['onTooManyRequests', 'parseRetryAfter'], A.amber],
  ['recipes/sse-resume.md', 'Recipe', 'SSE', 'resume', ['Last-Event-ID', 'sse-resume plugin'], A.olive],
  ['examples/index.md', 'Examples', 'Live', 'demos', ['React', 'Vue', 'Next.js', 'Nuxt', 'Svelte'], A.amber, CLIENT_CODE],
  ['examples/playground.md', 'Examples', 'Live', 'playground', ['status handlers', 'React Query', 'upload', 'SSE'], A.amber, CLIENT_CODE],
  ['examples/react.md', 'Live demo · React', 'React Query', 'live demo', ['useQuery', 'useMutation', 'isFetchError'], A.react],
  ['examples/next-ssr.md', 'Live demo · Next.js', 'Next.js SSR', 'live demo', ['cookies()', 'ssr-forward', 'server only'], A.next],
  ['examples/nuxt-ssr.md', 'Live demo · Nuxt', 'Nuxt SSR', '+ ssr-forward', ['createFetchPlugin', 'cookies', 'server only'], A.nuxt],
  ['examples/sse.md', 'Live demo', 'SSE', 'live demos', ['api.sse', 'useSse', 'Last-Event-ID'], A.amber],
  ['examples/upload.md', 'Live demo', 'Upload & download', 'progress', ['api.upload', 'onUploadProgress', 'onDownloadProgress'], A.amber],
  ['examples/devtools.md', 'Live demo', 'DevTools', 'preview', ['setupDevtools', 'call graph', 'SSE events'], A.olive],
  ['packages.md', 'Open source', 'npm packages', 'by Mohammad Garmabi', ['tanstack-fetch', 'vite-plugin-react-splash', 'SSE hooks'], A.amber, [
    '$ npm i tanstack-fetch',
    '$ npm i vite-plugin-react-splash',
    '$ npm i sse-shared-worker-react-hook',
    '$ npm i react-providers-tree',
    '$ npm i image-auth',
  ]],
  ['blog/react-axios-tanstack-fetch.md', 'Blog · Framework guide', 'React axios', 'vs tanstack-fetch', ['FetchProvider', 'useFetch', 'refresh-token'], A.react],
  ['blog/vue-ofetch-tanstack-fetch.md', 'Blog · Framework guide', 'Vue ofetch / axios', 'vs tanstack-fetch', ['createFetchPlugin', 'useFetch', 'Vue Query'], A.vue],
  ['blog/nextjs-fetch-tanstack-fetch.md', 'Blog · Framework guide', 'Next.js fetch', 'vs tanstack-fetch', ['ssr-forward', 'hydrate', 'SSE'], A.next],
  ['blog/nuxt-ofetch-tanstack-fetch.md', 'Blog · Framework guide', 'Nuxt $fetch', 'vs tanstack-fetch', ['createFetchPlugin', 'ssr-forward', 'Vue Query'], A.nuxt],
  ['blog/solid-fetch-tanstack-fetch.md', 'Blog · Framework guide', 'Solid fetch', 'vs tanstack-fetch', ['FetchProvider', 'useSse signals', 'Solid Query'], A.solid],
  ['blog/angular-http-client-tanstack-fetch.md', 'Blog · Framework guide', 'Angular HttpClient', 'vs tanstack-fetch', ['provideFetchClient', 'injectFetch', 'signals SSE'], A.angular],
  ['blog/sveltekit-fetch-tanstack-fetch.md', 'Blog · Framework guide', 'SvelteKit fetch', 'vs tanstack-fetch', ['setFetchClient', 'stores', 'load()'], A.svelte],
  ['blog/tanstack-start-router-tanstack-fetch.md', 'Blog · TanStack', 'Start & Router', '+ tanstack-fetch', ['queryOptions', 'ensureQueryData', 'router context'], A.amber],
  ['blog/tanstack-start-1-0-transtack-fetch-6-real-world-patterns.md', 'Blog · TanStack', 'TanStack Start 1.0', '6 real-world patterns', ['loaders', 'SSR auth', 'mutations', 'SSE'], A.amber],
  ['blog/tanstack-pacer-tanstack-query-tanstack-fetch.md', 'Blog · TanStack', 'TanStack Pacer', '+ Query + fetch', ['debounce', 'throttle', 'rate-limit', 'batch'], A.olive],
]

const frontmatter = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/)
  const out = {}
  if (!m) return out
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) out[kv[1]] = kv[2].replace(/^(['"])(.*)\1$/, '$2').replace(/\\'/g, "'")
  }
  return out
}

/** Leading non-shell code blocks (fallback: shell), joined until there is enough to fill the cover window. */
const sample = (src) => {
  const blocks = [...src.matchAll(/^```(\w+)[^\n]*\n([\s\S]*?)^```/gm)].map(([, lang, body]) => ({ lang, body }))
  const shell = (b) => ['bash', 'sh', 'shell', 'text', 'txt', 'md'].includes(b.lang)
  const pool = blocks.some((b) => !shell(b)) ? blocks.filter((b) => !shell(b)) : blocks
  const lines = []
  for (const b of pool) {
    if (lines.length) lines.push('')
    lines.push(...b.body.replace(/\s+$/, '').split('\n'))
    if (lines.length >= 5) break
  }
  const kept = lines.slice(0, 7)
  // don't end the window on a blank line or a dangling comment
  while (kept.length && /^\s*(\/\/.*)?$/.test(kept.at(-1))) kept.pop()
  return {
    lang: pool[0]?.lang ?? 'ts',
    lines: kept.map((l) => (l.length > 50 ? `${l.slice(0, 49)}…` : l)),
  }
}

const clip = (text, max) => {
  if (text.length <= max) return text
  return `${text.slice(0, text.lastIndexOf(' ', max))}…`
}

const firstParagraph = (src) =>
  src
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .split('\n')
    .find((l) => l.trim() && !/^[#:<!|`-]/.test(l.trim()))
    ?.replace(/[`*]/g, '') ?? ''

const blogSlug = (md) => md.replace(/^blog\//, '').replace(/\.md$/, '')
export const coverPath = (md) =>
  md.startsWith('blog/') ? `/images/blog-${blogSlug(md)}-cover.jpg` : `/images/page-${md.replace(/\.md$/, '').replace(/\//g, '-')}.jpg`

export const buildPages = () =>
  PAGES.map(([md, kicker, h1, h2, chips, accent, code]) => {
    const src = readFileSync(join(ROOT, md), 'utf8')
    const fm = frontmatter(src)
    const fallback = src.match(/^# (.+)$/m)?.[1] ?? h1
    const cover = coverPath(md)
    return {
      id: cover.replace(/^\/images\//, '').replace(/\.jpg$/, ''),
      md,
      cover,
      alt: fm.title ?? fallback,
      kicker,
      h1,
      h2,
      chips,
      accent,
      desc: clip(fm.description ?? firstParagraph(src), 140),
      code: code ? { lang: 'ts', lines: code } : sample(src),
    }
  })

/** Add the cover under the page heading (and as blog frontmatter `cover`). Idempotent. */
const inject = (page) => {
  const file = join(ROOT, page.md)
  let src = readFileSync(file, 'utf8')
  if (src.includes(`](${page.cover})`)) return false
  const img = `![${page.alt.replace(/[[\]]/g, '')}](${page.cover})`
  if (page.md.startsWith('blog/')) {
    if (!/^cover:/m.test(src)) src = src.replace(/^(---\n[\s\S]*?)\n---\n/, `$1\ncover: ${page.cover}\n---\n`)
    src = src.replace(/^(<p class="blog-meta">.*<\/p>)$/m, `$1\n\n${img}`)
  } else {
    src = src.replace(/^(# .+)$/m, `$1\n\n${img}`)
  }
  writeFileSync(file, src)
  return true
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pages = buildPages()
  writeFileSync(join(ROOT, 'scripts/motion/pages.json'), `${JSON.stringify(pages, null, 2)}\n`)
  console.log(`pages.json: ${pages.length} covers`)
  if (process.argv.includes('--inject')) {
    for (const p of pages) if (inject(p)) console.log('inject', p.md)
  }
}
