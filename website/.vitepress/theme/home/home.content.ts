import type {
  CompareRow,
  FeatureItem,
  FooterColumn,
  PackageItem,
  PillLink,
  ShowcaseItem,
  StackBlitzLink,
  TestimonialItem,
  WhyItem,
} from './home.type'
import rootPackage from '../../../../package.json'

const PACKAGE_VERSION = rootPackage.version as string
const GITHUB_URL = 'https://github.com/mohamadgarmabi/tanstack-fetch'
const CHANGELOG_URL = `${GITHUB_URL}/blob/main/CHANGELOG.md`
const NPM_URL = 'https://www.npmjs.com/package/tanstack-fetch'
const AUTHOR_URL = 'https://github.com/mohamadgarmabi'
const LINKEDIN_URL = 'https://www.linkedin.com/in/mohammad-garmabi/'
const RELEASE_POST_URL = '/blog/tanstack-fetch-1-6'
const STACKBLITZ_BASE =
  'https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples'

const INSTALL_COMMANDS = [
  { id: 'npm', label: 'npm', command: 'npm install tanstack-fetch' },
  { id: 'pnpm', label: 'pnpm', command: 'pnpm add tanstack-fetch' },
  { id: 'yarn', label: 'yarn', command: 'yarn add tanstack-fetch' },
  { id: 'bun', label: 'bun', command: 'bun add tanstack-fetch' },
] as const

const INSTALL_COMMAND = INSTALL_COMMANDS[0].command

const showcase: ShowcaseItem[] = [
  {
    id: 'query',
    label: 'Query native',
    lead: 'Return data, throw on failure, and pass the signal. That is the whole queryFn.',
    files: [
      {
        name: 'users.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: 'https://api.example.com' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) =>
    api.get<User[]>('/users', { signal }),
})`,
      },
    ],
    output: {
      name: 'result',
      code: `// data is User[]
[
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Grace' },
]

// isPending → false
// isError → false`,
    },
  },
  {
    id: 'errors',
    label: 'Typed errors',
    lead: 'HTTP failures throw FetchError. status, code, and body stay on the error.',
    files: [
      {
        name: 'user.ts',
        code: `import { createFetch, isFetchError } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: 'https://api.example.com',
})

try {
  await api.get<User, { id: string | number }>('/users/:id', {
    params: { id: 'missing' },
  })
} catch (error) {
  if (isFetchError(error)) {
    console.log(error.status, error.code)
  }
}`,
      },
    ],
    output: {
      name: 'console',
      code: `404 HTTP_404

FetchError {
  status: 404,
  code: 'HTTP_404',
  message: 'Not Found',
  body: { error: 'User not found' },
}`,
    },
  },
  {
    id: 'status',
    label: 'Status handlers',
    lead: 'Handle 401 through 429 in one place. The error still reaches Query.',
    files: [
      {
        name: 'api.ts',
        code: `import { createFetch, parseRetryAfter } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => localStorage.getItem('token'),
  onUnauthorized: () => logout(),
  onTooManyRequests: ({ context }) => {
    const waitMs = parseRetryAfter(
      context.response?.headers,
      1000,
    )
    console.warn('retry after', waitMs)
  },
})`,
      },
    ],
    output: {
      name: 'on 429',
      code: `// handler runs first
retry after 2000

// then Query still sees
FetchError {
  status: 429,
  code: 'HTTP_429',
}`,
    },
  },
  {
    id: 'refresh',
    label: 'Refresh token',
    lead: 'Before: refresh near expiry. After: refresh on the first 401, then retry. One single-flight promise for both.',
    files: [
      {
        name: 'api.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { createRefreshTokenInterceptor } from 'tanstack-fetch/plugins'

let accessToken = localStorage.getItem('access_token')
let expiresAt = Number(
  localStorage.getItem('access_expires_at') ?? 0,
)

const persist = (
  token: string,
  expiresInSeconds: number,
) => {
  accessToken = token
  expiresAt = Date.now() + expiresInSeconds * 1000
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem(
    'access_expires_at',
    String(expiresAt),
  )
}

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
  getToken: () => accessToken,
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
})

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{
        accessToken: string
        expiresIn: number
      }>('/auth/refresh', {
        interceptors: {
          eject: ['refresh-token', 'auth'],
        },
      })
      persist(body.accessToken, body.expiresIn)
    },
    // BEFORE — time-based
    before: {
      getExpiresAt: () => expiresAt,
      skewMs: 60_000,
    },
    // AFTER — first 401
    after: { enabled: true },
  }),
)`,
      },
    ],
    output: {
      name: 'flow',
      code: `// BEFORE (near expiry)
refresh → attach token
GET /me → 200

// AFTER (first 401)
GET /me → 401
refresh (single-flight)
GET /me → 200

// parallel 401s share
// one refreshPromise

// refresh fails →
onUnauthorized → /login`,
    },
  },
  {
    id: 'devtools',
    label: 'DevTools',
    lead: 'One line adds a dock for HTTP, SSE, SSR, and tRPC: status, duration, attempts, and the file that sent each request.',
    files: [
      {
        name: 'api.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { setupDevtools } from 'tanstack-fetch/devtools'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['trace'],
})

setupDevtools(api)

// toggle: Alt+Shift+F (macOS: ⌥⇧F)`,
      },
    ],
    output: {
      name: 'dock',
      code: `HTTP  GET  /api/profile  200  143ms
      2 attempts · profile.hook.ts

HTTP  POST /api/orders   500  320ms
      3 attempts · CreateOrder.tsx

SSE   GET  /api/stream   live → success
tRPC  user.list          200  112ms

// click a call-graph node →
// open in Cursor / Zed / VS Code`,
    },
  },
  {
    id: 'ssr',
    label: 'SSR',
    lead: 'Forward the incoming cookie jar on the server. Same client in Next.js and Nuxt.',
    files: [
      {
        name: 'next.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { cookies } from 'next/headers'

export const api = createFetch({
  baseUrl: process.env.API_URL,
  source: 'ssr',
  plugins: ['ssr-forward'],
  incoming: async () => {
    const jar = await cookies()
    return { cookie: jar.toString() }
  },
})`,
      },
      {
        name: 'nuxt.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const api = createFetch({
    baseUrl: useRuntimeConfig().public.apiBase,
    source: import.meta.server ? 'ssr' : 'client',
    plugins: ['ssr-forward'],
    incoming: () => {
      if (!import.meta.server) return
      const headers = useRequestHeaders(['cookie'])
      return { cookie: headers.cookie }
    },
  })

  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
})`,
      },
    ],
    output: {
      name: 'forwarded',
      code: `// server request headers
Cookie: session=abc; theme=dark

// same api.get('/me') works
// in RSC / Nuxt SSR and browser`,
    },
  },
  {
    id: 'sse',
    label: 'SSE',
    lead: 'Streams go over fetch, so Authorization and cookies travel with the request. Same client in a loop, React, or Vue.',
    files: [
      {
        name: 'orders.ts',
        code: `import { createFetch } from 'tanstack-fetch/sse'

type OrderEvent = { id: string; status: string }

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('token'),
})

for await (const event of api.sse<OrderEvent>(
  '/orders/stream',
)) {
  console.log(event.data)
}`,
      },
      {
        name: 'OrdersLive.tsx',
        code: `import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

type OrderEvent = { id: string; status: string }

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>(
    '/orders/stream',
    { client: api },
  )

  if (status === 'error') {
    return <p>{error?.message}</p>
  }

  return (
    <div>
      <p>{status}</p>
      <p>{data?.id ?? 'waiting…'}</p>
      <button type="button" onClick={close}>
        Disconnect
      </button>
    </div>
  )
}`,
      },
      {
        name: 'OrdersLive.vue',
        code: `<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

type OrderEvent = { id: string; status: string }

const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('token'),
})

const { data, status, error, close } = useSse<OrderEvent>(
  '/orders/stream',
  { client: api },
)
</script>

<template>
  <p v-if="status === 'error'">{{ error?.message }}</p>
  <div v-else>
    <p>{{ status }}</p>
    <p>{{ data?.id ?? 'waiting…' }}</p>
    <button type="button" @click="close">
      Disconnect
    </button>
  </div>
</template>`,
      },
    ],
    output: {
      name: 'stream',
      code: `status → connecting
status → connected

{ id: 'o1', status: 'paid' }
{ id: 'o2', status: 'shipped' }
{ id: 'o3', status: 'delivered' }

// Authorization: Bearer … is sent
// EventSource cannot do that
// plugin / FetchProvider optional`,
    },
  },
  {
    id: 'upload',
    label: 'Upload',
    lead: 'Send a file with progress. Fetch has no upload progress, so this path uses XHR.',
    files: [
      {
        name: 'upload.ts',
        code: `await api.upload('/files', {
  file,
  fields: { albumId: '1' },
  onUploadProgress: ({ progress }) => {
    setProgress(progress)
  },
})`,
      },
    ],
    output: {
      name: 'progress',
      code: `progress → 0.12
progress → 0.48
progress → 0.91
progress → 1

← { id: 'f_19', url: '/files/f_19' }`,
    },
  },
  {
    id: 'trpc',
    label: 'tRPC',
    lead: 'The same client, auth, and plugins become the tRPC link.',
    files: [
      {
        name: 'trpc.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'

const api = createFetch({
  getToken: () => localStorage.getItem('token'),
})

const trpcClient = createTRPCFetchClient<AppRouter>({
  url: '/api/trpc',
  client: api,
})

const posts = await trpcClient.post.list.query()`,
      },
    ],
    output: {
      name: 'posts',
      code: `[
  { id: 1, title: 'Ship SSR' },
  { id: 2, title: 'Add SSE' },
]

// Authorization comes from
// the same createFetch client`,
    },
  },
  {
    id: 'openapi',
    label: 'OpenAPI',
    lead: 'Generate a typed client from an OpenAPI document with the bundled CLI.',
    files: [
      {
        name: 'terminal',
        code: `npx tanstack-fetch generate \\
  --input ./openapi.yaml \\
  --out ./src/api`,
      },
      {
        name: 'client.ts',
        code: `import { api } from './api'

const users = await api.getUsers({
  query: { limit: 20 },
})`,
      },
    ],
    output: {
      name: 'generated',
      code: `src/api/
  index.ts
  types.ts

// paths + params typed
// from the OpenAPI document`,
    },
  },
]

const features: FeatureItem[] = [
  {
    title: 'Query-shaped client',
    text: 'Success returns data. Failure throws. Cancellation follows AbortSignal.',
  },
  {
    title: 'Typed FetchError',
    text: 'status, code, and body are on the error. isFetchError narrows it.',
  },
  {
    title: 'Status handlers',
    text: '401, 403, 404, 429, other 4xx, and 5xx each have a hook.',
  },
  {
    title: 'Refresh on 401',
    text: 'createRefreshTokenInterceptor: before (time) and after (first 401), single-flight.',
  },
  {
    title: 'Request DevTools',
    text: 'setupDevtools(api) shows HTTP, SSE, SSR, and tRPC with attempts, timing, and caller file.',
  },
  {
    title: '4.81KB HTTP core',
    text: 'The HTTP entry is the core. SSE, React, Vue, plugins, and tRPC are separate imports.',
  },
  {
    title: 'Plugins',
    text: 'Named interceptors for retry, trace, and mocks. Eject one on a single call.',
  },
  {
    title: 'SSR forwarding',
    text: 'Next.js and other server renders can forward cookies and auth headers.',
  },
  {
    title: 'SSE with auth',
    text: 'Streams use fetch, so Authorization is a normal header. EventSource cannot send it.',
  },
  {
    title: 'Upload progress',
    text: 'Multipart upload with onUploadProgress, without a second HTTP library.',
  },
  {
    title: 'tRPC link',
    text: 'Router and Start can share the same token, plugins, and base client.',
  },
  {
    title: 'OpenAPI codegen',
    text: 'Generate a typed client from an OpenAPI document with the bundled CLI.',
  },
  {
    title: 'React helpers',
    text: 'FetchProvider, useFetch, and useSse when a component tree should share one client.',
  },
  {
    title: 'Vue & Nuxt helpers',
    text: 'createFetchPlugin, useFetch, and useSse for Vue 3 and Nuxt apps.',
  },
]

const packages: PackageItem[] = [
  {
    title: 'HTTP core',
    spec: 'tanstack-fetch',
    text: 'get, post, put, patch, delete, and upload.',
    tags: ['4.81KB'],
    href: '/api/create-fetch',
  },
  {
    title: 'Server-sent events',
    spec: 'tanstack-fetch/sse',
    text: 'fetch-based streams with resume and Authorization.',
    tags: ['5.94KB'],
    href: '/guide/sse',
  },
  {
    title: 'Plugins',
    spec: 'tanstack-fetch/plugins',
    text: 'Retry, trace, SSR forward, and status helpers.',
    tags: ['1.13KB'],
    href: '/api/plugins',
  },
  {
    title: 'React',
    spec: 'tanstack-fetch/react',
    text: 'Provider and hooks for a shared client.',
    tags: ['0.81KB'],
    href: '/guide/react',
  },
  {
    title: 'Vue & Nuxt',
    spec: 'tanstack-fetch/vue',
    text: 'Plugin and composables for Vue 3 and Nuxt.',
    tags: ['0.78KB'],
    href: '/guide/vue',
  },
  {
    title: 'tRPC',
    spec: 'tanstack-fetch/trpc',
    text: 'A tRPC link that reuses createFetch.',
    tags: ['3.16KB'],
    href: '/guide/trpc',
  },
  {
    title: 'DevTools',
    spec: 'tanstack-fetch/devtools',
    text: 'A request dock for HTTP, SSE, SSR, and tRPC.',
    tags: ['8.32KB'],
    href: '/examples/devtools',
  },
  {
    title: 'OpenAPI CLI',
    spec: 'tanstack-fetch generate',
    text: 'Turn an OpenAPI document into a typed client.',
    tags: ['CLI'],
    href: '/guide/openapi',
  },
]

const compareRows: CompareRow[] = [
  {
    feature: 'queryFn returns data, throws, and takes signal',
    href: '/guide/tanstack-query',
    fetch: 'yes',
    axios: 'partial',
    ky: 'partial',
    ofetch: 'partial',
  },
  {
    feature: 'Typed error with status and body',
    href: '/guide/errors',
    fetch: 'yes',
    axios: 'partial',
    ky: 'partial',
    ofetch: 'partial',
  },
  {
    feature: 'Handlers for 401 through 429',
    href: '/guide/configuration',
    fetch: 'yes',
    axios: 'no',
    ky: 'no',
    ofetch: 'no',
  },
  {
    feature: 'Refresh before expiry + after first 401',
    href: '/recipes/refresh-token',
    fetch: 'yes',
    axios: 'partial',
    ky: 'no',
    ofetch: 'no',
  },
  {
    feature: 'Next.js cookie forwarding',
    href: '/guide/ssr',
    fetch: 'yes',
    axios: 'no',
    ky: 'no',
    ofetch: 'no',
  },
  {
    feature: 'SSE that can send Authorization',
    href: '/guide/sse',
    fetch: 'yes',
    axios: 'no',
    ky: 'no',
    ofetch: 'no',
  },
  {
    feature: 'Upload progress',
    href: '/guide/upload',
    fetch: 'yes',
    axios: 'yes',
    ky: 'no',
    ofetch: 'no',
  },
  {
    feature: 'Request DevTools for HTTP, SSE, SSR, tRPC',
    href: '/examples/devtools',
    fetch: 'yes',
    axios: 'no',
    ky: 'no',
    ofetch: 'no',
  },
  {
    feature: 'tRPC link on the same client',
    href: '/guide/trpc',
    fetch: 'yes',
    axios: 'no',
    ky: 'no',
    ofetch: 'no',
  },
]

const whyAxios: WhyItem[] = [
  {
    title: 'Built for queryFn',
    text: 'axios wraps responses. tanstack-fetch returns data, throws FetchError, and takes signal.',
  },
  {
    title: 'SSR cookies without glue',
    text: 'ssr-forward ships cookie and auth headers from the incoming request. No hand-rolled adapter.',
  },
  {
    title: 'SSE that can authenticate',
    text: 'EventSource cannot send Authorization. tanstack-fetch/sse uses fetch, so tokens work.',
  },
]

const quickstartCode = `import { createFetch } from 'tanstack-fetch'
import { useQuery } from '@tanstack/react-query'

const api = createFetch({ baseUrl: '/api' })

useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get('/users', { signal }),
})`

const testimonials: TestimonialItem[] = [
  {
    quote:
      'Drop createFetch into queryFn and stop rewriting axios adapters for AbortSignal and errors.',
    author: 'For TanStack Query apps',
    role: 'Primary fit',
  },
  {
    quote: 'One client for REST, SSR cookie forwarding, SSE with auth, and a tRPC link.',
    author: 'For fullstack TypeScript',
    role: 'Same mental model',
  },
  {
    quote: '4.81KB HTTP core. Pull SSE, React, Vue, plugins, or tRPC only when you need them.',
    author: 'For bundle-conscious teams',
    role: 'Tree-shakeable entries',
  },
]

const stackBlitzLinks: StackBlitzLink[] = [
  {
    label: 'TanStack Query',
    href: `${STACKBLITZ_BASE}/tanstack-query`,
    docs: '/examples/react',
  },
  {
    label: 'Next.js SSR',
    href: `${STACKBLITZ_BASE}/next-ssr`,
    docs: '/examples/next-ssr',
  },
  {
    label: 'Upload',
    href: `${STACKBLITZ_BASE}/file-upload`,
    docs: '/examples/upload',
  },
  {
    label: 'SSE',
    href: `${STACKBLITZ_BASE}/sse-live`,
    docs: '/examples/sse',
  },
  {
    label: 'tRPC',
    href: `${STACKBLITZ_BASE}/trpc`,
    docs: '/recipes/trpc',
  },
  {
    label: 'Auth status',
    href: `${STACKBLITZ_BASE}/auth-status`,
    docs: '/recipes/refresh-token',
  },
]

const runtimes: PillLink[] = [
  { label: 'Node.js', href: '/guide/getting-started' },
  { label: 'Bun', href: '/guide/getting-started' },
  { label: 'Deno', href: '/guide/getting-started' },
  { label: 'Cloudflare Workers', href: '/guide/getting-started' },
  { label: 'Browsers', href: '/guide/getting-started' },
  { label: 'Next.js', href: '/guide/ssr#nextjs' },
  { label: 'Nuxt', href: '/guide/ssr#nuxt' },
  { label: 'Edge', href: '/guide/ssr' },
]

const integrations: PillLink[] = [
  { label: 'TanStack Query', href: '/guide/tanstack-query' },
  { label: 'React', href: '/guide/react' },
  { label: 'Vue', href: '/guide/vue' },
  { label: 'Nuxt', href: '/guide/vue' },
  { label: 'Next.js', href: '/guide/ssr' },
  { label: 'tRPC', href: '/guide/trpc' },
  { label: 'TanStack Router', href: '/recipes/trpc' },
  { label: 'TanStack Start', href: '/recipes/trpc' },
  { label: 'OpenAPI', href: '/guide/openapi' },
]

const footerColumns: FooterColumn[] = [
  {
    title: 'Documentation',
    links: [
      { label: 'Getting started', href: '/guide/getting-started' },
      { label: 'Configuration', href: '/guide/configuration' },
      { label: 'Errors', href: '/guide/errors' },
      { label: 'TanStack Query', href: '/guide/tanstack-query' },
      { label: 'Comparison', href: '/guide/comparison' },
      { label: 'LLM context', href: '/llms.txt' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { label: 'SSR (Next.js & Nuxt)', href: '/guide/ssr' },
      { label: 'React', href: '/guide/react' },
      { label: 'Vue & Nuxt', href: '/guide/vue' },
      { label: 'SSE', href: '/guide/sse' },
      { label: 'Upload', href: '/guide/upload' },
      { label: 'tRPC', href: '/guide/trpc' },
      { label: 'Refresh token', href: '/recipes/refresh-token' },
      { label: 'OpenAPI', href: '/guide/openapi' },
    ],
  },
  {
    title: 'Examples',
    links: [
      { label: 'Playground', href: '/examples/playground' },
      { label: 'React Query', href: '/examples/react' },
      { label: 'Next.js SSR', href: '/examples/next-ssr' },
      { label: 'Nuxt SSR', href: '/examples/nuxt-ssr' },
      { label: 'Upload', href: '/examples/upload' },
      { label: 'SSE', href: '/examples/sse' },
      { label: 'DevTools', href: '/examples/devtools' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'npm', href: NPM_URL },
      { label: 'Blog', href: '/blog/' },
      { label: 'Author', href: '/author' },
      { label: 'Packages', href: '/packages' },
      { label: 'Changelog', href: CHANGELOG_URL },
    ],
  },
]

export {
  AUTHOR_URL,
  CHANGELOG_URL,
  GITHUB_URL,
  INSTALL_COMMAND,
  INSTALL_COMMANDS,
  LINKEDIN_URL,
  NPM_URL,
  PACKAGE_VERSION,
  RELEASE_POST_URL,
  compareRows,
  features,
  footerColumns,
  integrations,
  packages,
  quickstartCode,
  runtimes,
  showcase,
  stackBlitzLinks,
  testimonials,
  whyAxios,
}
