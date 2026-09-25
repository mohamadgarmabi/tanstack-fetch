import type {
  CompareRow,
  FeatureItem,
  FooterColumn,
  PackageItem,
  PillLink,
  ShowcaseItem,
} from './home.type'

const GITHUB_URL = 'https://github.com/mohamadgarmabi/tanstack-fetch'
const NPM_URL = 'https://www.npmjs.com/package/tanstack-fetch'
const AUTHOR_URL = 'https://github.com/mohamadgarmabi'
const LINKEDIN_URL = 'https://www.linkedin.com/in/mohammad-garmabi/'

const INSTALL_COMMAND = 'npm install tanstack-fetch'

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
  await api.get<User>('/users/:id', {
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
  onUnauthorized: () => {
    localStorage.removeItem('token')
  },
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
    id: 'params',
    label: 'Path params',
    lead: 'Typed path params fill :id and similar segments. No string concat.',
    files: [
      {
        name: 'profile.ts',
        code: `const user = await api.get<User>(
  '/users/:id/posts/:postId',
  {
    params: { id: '42', postId: '9' },
  },
)`,
      },
    ],
    output: {
      name: 'request + data',
      code: `GET /users/42/posts/9

user ← {
  id: '42',
  postId: '9',
  title: 'Hello',
}`,
    },
  },
  {
    id: 'ssr',
    label: 'SSR',
    lead: 'Forward the incoming cookie jar on the server. The browser client stays the same.',
    files: [
      {
        name: 'api.ts',
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
    ],
    output: {
      name: 'forwarded',
      code: `// server request headers
Cookie: session=abc; theme=dark

// same api.get('/me') works
// in RSC and in the browser`,
    },
  },
  {
    id: 'sse',
    label: 'SSE',
    lead: 'Streams go over fetch, so Authorization and cookies travel with the request.',
    files: [
      {
        name: 'orders.ts',
        code: `import { createFetch } from 'tanstack-fetch/sse'

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
    ],
    output: {
      name: 'stream',
      code: `{ id: 'o1', status: 'paid' }
{ id: 'o2', status: 'shipped' }
{ id: 'o3', status: 'delivered' }

// Authorization: Bearer … is sent
// EventSource cannot do that`,
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
    id: 'plugins',
    label: 'Plugins',
    lead: 'Named interceptors for retry and tracing. Eject one on a single call when you need to.',
    files: [
      {
        name: 'api.ts',
        code: `const api = createFetch({
  baseUrl: 'https://api.example.com',
  plugins: ['trace', 'retry-idempotent'],
})

await api.get('/health')

await api.get('/reports', {
  eject: ['retry-idempotent'],
})`,
      },
    ],
    output: {
      name: 'trace',
      code: `[trace] GET /health → 200 (42ms)
[retry] skipped on /reports

// eject removes one plugin
// for that request only`,
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
    id: 'react',
    label: 'React',
    lead: 'Optional provider and hooks. The HTTP core stays out of the React bundle until you import it.',
    files: [
      {
        name: 'app.tsx',
        code: `import { FetchProvider, useFetch } from 'tanstack-fetch/react'
import { useQuery } from '@tanstack/react-query'

const App = () => (
  <FetchProvider
    baseUrl="https://api.example.com"
    plugins={['trace']}
  >
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const api = useFetch()
  return useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) =>
      api.get<User[]>('/users', { signal }),
  })
}`,
      },
    ],
    output: {
      name: 'hook result',
      code: `{
  data: [{ id: '1', name: 'Ada' }],
  isPending: false,
  isError: false,
}

// useFetch() shares one client
// for the whole tree`,
    },
  },
  {
    id: 'abort',
    label: 'AbortSignal',
    lead: 'Pass Query’s signal and cancels stay clean. No false error after unmount.',
    files: [
      {
        name: 'search.ts',
        code: `useQuery({
  queryKey: ['search', q],
  queryFn: ({ signal }) =>
    api.get<Hit[]>('/search', {
      query: { q },
      signal,
    }),
})`,
      },
    ],
    output: {
      name: 'cancel',
      code: `// user types fast → previous
// request aborts

AbortedError (ignored by Query)

// new request →
[{ id: 'h1', title: 'fetch' }]`,
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
    title: 'About 3.5KB',
    text: 'The HTTP entry is the core. SSE, React, plugins, and tRPC are separate imports.',
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
    title: 'Runs at the edge',
    text: 'The core is fetch. Node, Bun, Deno, workers, and the browser all qualify.',
  },
]

const packages: PackageItem[] = [
  {
    title: 'HTTP core',
    spec: 'tanstack-fetch',
    text: 'get, post, put, patch, delete, and upload.',
    tags: ['~3.5KB'],
    href: '/api/create-fetch',
  },
  {
    title: 'Server-sent events',
    spec: 'tanstack-fetch/sse',
    text: 'fetch-based streams with resume and Authorization.',
    tags: ['~4.7KB'],
    href: '/guide/sse',
  },
  {
    title: 'Plugins',
    spec: 'tanstack-fetch/plugins',
    text: 'Retry, trace, SSR forward, and status helpers.',
    tags: ['~0.9KB'],
    href: '/api/plugins',
  },
  {
    title: 'React',
    spec: 'tanstack-fetch/react',
    text: 'Provider and hooks for a shared client.',
    tags: ['~1KB'],
    href: '/guide/react',
  },
  {
    title: 'tRPC',
    spec: 'tanstack-fetch/trpc',
    text: 'A tRPC link that reuses createFetch.',
    tags: ['~3.1KB'],
    href: '/guide/trpc',
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
    feature: 'tRPC link on the same client',
    href: '/guide/trpc',
    fetch: 'yes',
    axios: 'no',
    ky: 'no',
    ofetch: 'no',
  },
]

const runtimes: PillLink[] = [
  { label: 'Node.js', href: '/guide/getting-started' },
  { label: 'Bun', href: '/guide/getting-started' },
  { label: 'Deno', href: '/guide/getting-started' },
  { label: 'Cloudflare Workers', href: '/guide/getting-started' },
  { label: 'Browsers', href: '/guide/getting-started' },
  { label: 'Next.js', href: '/guide/ssr' },
  { label: 'Edge', href: '/guide/ssr' },
]

const integrations: PillLink[] = [
  { label: 'TanStack Query', href: '/guide/tanstack-query' },
  { label: 'React', href: '/guide/react' },
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
    ],
  },
  {
    title: 'Guides',
    links: [
      { label: 'SSR and Next.js', href: '/guide/ssr' },
      { label: 'SSE', href: '/guide/sse' },
      { label: 'Upload', href: '/guide/upload' },
      { label: 'tRPC', href: '/guide/trpc' },
      { label: 'OpenAPI', href: '/guide/openapi' },
      { label: 'Plugins', href: '/guide/plugins' },
    ],
  },
  {
    title: 'Examples',
    links: [
      { label: 'Playground', href: '/examples/playground' },
      { label: 'React Query', href: '/examples/react' },
      { label: 'Next.js SSR', href: '/examples/next-ssr' },
      { label: 'Upload', href: '/examples/upload' },
      { label: 'SSE', href: '/examples/sse' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: GITHUB_URL },
      { label: 'npm', href: NPM_URL },
      { label: 'Author', href: '/author' },
      { label: 'Packages', href: '/packages' },
      { label: 'Changelog', href: `${GITHUB_URL}/blob/main/CHANGELOG.md` },
    ],
  },
]

const stats = [
  { value: '~3.5KB', label: 'gzip HTTP core' },
  { value: '5', label: 'tree-shaken entries' },
  { value: 'MIT', label: 'licensed, free' },
  { value: 'v1.2', label: 'current release' },
]

export {
  AUTHOR_URL,
  GITHUB_URL,
  INSTALL_COMMAND,
  LINKEDIN_URL,
  NPM_URL,
  compareRows,
  features,
  footerColumns,
  integrations,
  packages,
  runtimes,
  showcase,
  stats,
}
