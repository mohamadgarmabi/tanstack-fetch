#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blogDir = join(root, 'blog')

const seriesLinks = [
  ['React', '/blog/react-axios-tanstack-fetch'],
  ['Vue', '/blog/vue-ofetch-tanstack-fetch'],
  ['Next.js', '/blog/nextjs-fetch-tanstack-fetch'],
  ['Nuxt', '/blog/nuxt-ofetch-tanstack-fetch'],
  ['Solid', '/blog/solid-fetch-tanstack-fetch'],
  ['TanStack Start / Router', '/blog/tanstack-start-router-tanstack-fetch'],
  ['Svelte / SvelteKit', '/blog/sveltekit-fetch-tanstack-fetch'],
  ['Angular', '/blog/angular-http-client-tanstack-fetch'],
]

const diagram = (id, ui, query, adapter, note, footer) => `<div class="blog-diagram" aria-hidden="true">
<svg viewBox="0 0 920 320" role="img">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9a4a"/>
      <stop offset="100%" stop-color="#ff5a1f"/>
    </linearGradient>
  </defs>
  <rect width="920" height="320" rx="18" fill="#0c0c10" stroke="rgba(255,122,24,0.25)"/>
  <rect x="40" y="110" width="150" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="115" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">${ui[0]}</text>
  <text x="115" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">${ui[1]}</text>
  <path d="M198 155 H248" stroke="#ff7a18" stroke-width="2"/>
  <rect x="250" y="110" width="170" height="90" rx="14" fill="rgba(255,122,24,0.08)" stroke="rgba(255,122,24,0.4)"/>
  <text x="335" y="148" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">${query[0]}</text>
  <text x="335" y="172" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">${query[1]}</text>
  <path d="M428 155 H478" stroke="#ff7a18" stroke-width="2"/>
  <rect x="480" y="95" width="200" height="120" rx="14" fill="url(#${id})" opacity="0.18" stroke="#ff7a18"/>
  <text x="580" y="140" text-anchor="middle" fill="#ffe7d1" font-size="15" font-family="Inter,sans-serif" font-weight="700">tanstack-fetch</text>
  <text x="580" y="164" text-anchor="middle" fill="#ffd2a8" font-size="12" font-family="Inter,sans-serif">${adapter}</text>
  <text x="580" y="186" text-anchor="middle" fill="#c4c4cc" font-size="11" font-family="Inter,sans-serif">data · throw · signal</text>
  <path d="M688 155 H738" stroke="#ff7a18" stroke-width="2"/>
  <rect x="740" y="110" width="140" height="90" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)"/>
  <text x="810" y="150" text-anchor="middle" fill="#f4f4f5" font-size="15" font-family="Inter,sans-serif" font-weight="600">API</text>
  <text x="810" y="174" text-anchor="middle" fill="#a1a1aa" font-size="12" font-family="Inter,sans-serif">REST · SSE · tRPC</text>
  <text x="460" y="50" text-anchor="middle" fill="#a1a1aa" font-size="13" font-family="Inter,sans-serif">${note}</text>
  <text x="460" y="280" text-anchor="middle" fill="#71717a" font-size="12" font-family="Inter,sans-serif">${footer}</text>
</svg>
</div>`

const chart = (altLabel, rows) => `<div class="blog-chart" role="img" aria-label="Boilerplate comparison chart">
${rows
  .map(
    ([label, tf, alt]) => `  <div class="blog-chart-row">
    <span class="blog-chart-label">${label}</span>
    <div class="blog-chart-track">
      <div class="blog-chart-bar is-tf" style="--w: ${tf[1]}">${tf[0]}</div>
      <div class="blog-chart-bar is-http" style="--w: ${alt[1]}">${alt[0]}</div>
    </div>
  </div>`,
  )
  .join('\n')}
  <p class="blog-chart-legend">
    <span class="is-tf">tanstack-fetch</span>
    <span class="is-http">${altLabel}</span>
  </p>
</div>`

const flow = `<div class="blog-flow" aria-hidden="true">
  <div class="blog-flow-step">connecting</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step is-accent">connected</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step">onMessage → data</div>
  <div class="blog-flow-arrow">→</div>
  <div class="blog-flow-step">close / unmount</div>
</div>`

const seriesNav = (slug) => {
  const links = seriesLinks
    .filter(([, href]) => !href.endsWith(slug))
    .map(([label, href]) => `- [${label}](${href})`)
    .join('\n')
  return `## Series\n\nSame deep-dive format for every stack:\n\n${links}`
}

const posts = [
  {
    file: 'react-axios-tanstack-fetch.md',
    title: 'React axios vs tanstack-fetch: typed fetch for TanStack Query',
    description:
      'Replace axios unwrap glue with tanstack-fetch — FetchProvider, useFetch, useSse, React Query, refresh-token, migrate CLI, and a full side-by-side comparison.',
    h1: 'React axios vs tanstack-fetch',
    meta: 'October 12, 2026 · React · TanStack Query · HTTP',
    tip: '**React 18+** · `tanstack-fetch/react` · `@tanstack/react-query`',
    intro: `axios is great at interceptors. It is **not** shaped for TanStack Query’s \`queryFn\` contract: return data, throw on failure, honor \`AbortSignal\`.

That gap shows up as \`.data\` unwraps, custom error mappers, and refresh-token races. **tanstack-fetch** closes it with the same client every other stack uses — via \`FetchProvider\` / \`useFetch\` when you want context.`,
    install: 'npm install tanstack-fetch @tanstack/react-query',
    tldr: `| Drop into \`useQuery\` / \`useMutation\` | **tanstack-fetch** |
| Typed \`FetchError\` with status + body | **tanstack-fetch** |
| SSE with \`Authorization\` + resume | **tanstack-fetch/sse** + \`useSse\` |
| Huge axios interceptor stack, no Query | axios can stay |
| Share one client with Vue/Solid/Angular | **tanstack-fetch** |`,
    mental: `axios returns \`AxiosResponse\`. TanStack Query wants the **body** and a thrown error. Bridging is possible — and noisy.`,
    diagram: diagram(
      'g-react',
      ['Component', 'hooks · JSX'],
      ['React Query', 'useQuery · cache'],
      'useFetch() · createFetch',
      'React context: FetchProvider → useFetch (optional for SSE)',
      'axios stays optional while migrating modules',
    ),
    glueTitle: 'axios + Query (glue)',
    glue: `\`\`\`tsx
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

const UsersPage = () => {
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: async ({ signal }) => {
      const response = await axios.get<User[]>('/users', { signal })
      return response.data // easy to forget
    },
  })
  // map AxiosError → UI yourself
}
\`\`\``,
    nativeTitle: 'tanstack-fetch + Query (native)',
    native: `\`\`\`tsx
import { FetchProvider, useFetch } from 'tanstack-fetch/react'
import { useQuery } from '@tanstack/react-query'
import { isFetchError } from 'tanstack-fetch'

const App = () => (
  <FetchProvider
    baseUrl={import.meta.env.VITE_API_URL}
    getToken={() => localStorage.getItem('access_token')}
  >
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const api = useFetch()
  const { data, error, isPending } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })

  if (isPending) return <p>Loading…</p>
  if (isFetchError(error)) return <p>{error.status}: {error.message}</p>
  return <ul>{data.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
}
\`\`\``,
    bootstrap: `\`\`\`tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FetchProvider } from 'tanstack-fetch/react'
import { createFetch } from 'tanstack-fetch'
import { createAuthInterceptor } from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') })],
})

const queryClient = new QueryClient()

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <FetchProvider client={api}>
      <Routes />
    </FetchProvider>
  </QueryClientProvider>
)
\`\`\`

Or skip the provider and import a module-level \`api\` into every \`queryFn\` — \`FetchProvider\` is optional.`,
    altLabel: 'typical axios path',
    chartRows: [
      ['Query-ready GET', ['tanstack-fetch', '18%'], ['axios + .data', '70%']],
      ['Typed HTTP errors', ['FetchError', '22%'], ['AxiosError map', '65%']],
      ['401 refresh + retry', ['refresh-token plugin', '28%'], ['interceptor queue', '88%']],
      ['SSE + Authorization', ['useSse', '30%'], ['EventSource / custom', '95%']],
      ['Shared with Vue/Solid', ['one createFetch', '20%'], ['rewrite per stack', '88%']],
    ],
    matrixAlt: 'axios',
    matrixRows: `| Returns body for Query \`queryFn\` | Yes | Adapt (\`.data\`) |
| Throws typed error with status/body | \`FetchError\` | Partial |
| Native \`AbortSignal\` | First-class | Yes (adapt) |
| Status handlers \`401\`–\`429\` | \`createStatusInterceptor\` | Custom |
| Refresh token single-flight | Plugin | Custom |
| Path params typing \`:id\` | Yes | Manual |
| Upload + progress | \`api.upload()\` (\`tanstack-fetch/sse\`) | Yes |
| SSE + \`Authorization\` | \`tanstack-fetch/sse\` | No |
| tRPC transport | \`tanstack-fetch/trpc\` | DIY |
| Bundle (HTTP core) | 3.57KB gzip | Larger |`,
    mutation: `\`\`\`tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useFetch } from 'tanstack-fetch/react'

const CreateUser = () => {
  const api = useFetch()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  return <button onClick={() => mutation.mutate({ name: 'Ada' })}>Create</button>
}
\`\`\``,
    sse: `\`\`\`tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  if (status === 'error') return <p>{error?.message}</p>
  return (
    <div>
      <p>{status}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button type="button" onClick={close}>Stop</button>
    </div>
  )
}
\`\`\`

**FetchProvider is not required** for SSE — pass \`{ client }\`.`,
    trpc: `\`\`\`tsx
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { useQuery, QueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { api } from './api'
import type { AppRouter } from './server'

const queryClient = new QueryClient()
const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})
const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient })

useQuery(trpc.post.list.queryOptions())
\`\`\``,
    migrate: `\`\`\`bash
npx tanstack-fetch migrate --from axios --framework react --write
npx tanstack-fetch doctor --dir ./src
\`\`\`

1. One \`createFetch\` (+ optional \`FetchProvider\`)
2. Port \`useQuery\` reads first
3. Port mutations
4. Swap custom 401 refresh for the plugin
5. Delete axios when call sites are gone`,
    layout: `\`\`\`text
src/
  lib/api.ts
  queries/users.ts
  components/UsersPage.tsx
  components/OrdersLive.tsx
  App.tsx          # QueryClientProvider + FetchProvider
\`\`\``,
    decisionAlt: 'axios',
    checklist: `- [ ] Optional \`FetchProvider\` or shared \`api\` module
- [ ] Every \`queryFn\` / \`mutationFn\` forwards \`{ signal }\`
- [ ] Errors via \`isFetchError\` when you need \`status\`
- [ ] Refresh via plugin
- [ ] SSE from \`tanstack-fetch/sse\` when auth matters
- [ ] \`npx tanstack-fetch doctor --dir ./src\` clean`,
    related: `- [React guide](/guide/react)
- [SSE · React](/guide/sse#react)
- [tRPC · React](/guide/trpc#react)
- [Migrate CLI](/guide/migrate)
- [Comparison](/guide/comparison)`,
    guideSlug: 'react',
  },
  {
    file: 'vue-ofetch-tanstack-fetch.md',
    title: 'Vue ofetch / axios vs tanstack-fetch: typed fetch for Vue Query',
    description:
      'Replace ofetch and axios glue in Vue 3 with tanstack-fetch — createFetchPlugin, useFetch, useSse, Vue Query, refresh-token, and a full comparison.',
    h1: 'Vue ofetch / axios vs tanstack-fetch',
    meta: 'October 12, 2026 · Vue · TanStack Query · HTTP',
    tip: '**Vue 3.3+** · `tanstack-fetch/vue` · `@tanstack/vue-query`',
    intro: `ofetch and axios are fine transporters. They are **not** shaped for Vue Query’s \`queryFn\` contract: return data, throw on failure, honor \`AbortSignal\`.

**tanstack-fetch** gives Vue the same client as React — via \`createFetchPlugin\` + \`useFetch\` composables.`,
    install: 'npm install tanstack-fetch vue @tanstack/vue-query',
    tldr: `| Drop into \`useQuery\` / \`useMutation\` | **tanstack-fetch** |
| Typed \`FetchError\` | **tanstack-fetch** |
| SSE + \`Authorization\` | \`useSse\` from \`tanstack-fetch/vue\` |
| Simple script without Query | ofetch is fine |
| Share client with React/Nuxt | **tanstack-fetch** |`,
    mental: `ofetch returns the body on success but error shapes differ from Query’s expectations. axios still wants \`.data\`. One client should do both REST and SSE.`,
    diagram: diagram(
      'g-vue',
      ['SFC', 'script setup'],
      ['Vue Query', 'useQuery · cache'],
      'useFetch() · plugin',
      'Vue plugin: createFetchPlugin → inject / useFetch',
      'ofetch stays fine for one-off scripts outside Query',
    ),
    glueTitle: 'axios / ofetch + Query (glue)',
    glue: `\`\`\`ts
import axios from 'axios'
import { useQuery } from '@tanstack/vue-query'

const { data, error, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: async ({ signal }) => {
    const res = await axios.get<User[]>('/users', { signal })
    return res.data
  },
})
\`\`\``,
    nativeTitle: 'tanstack-fetch + Vue Query',
    native: `\`\`\`ts
import { createApp } from 'vue'
import { createFetch } from 'tanstack-fetch'
import { createAuthInterceptor } from 'tanstack-fetch/plugins'
import { createFetchPlugin } from 'tanstack-fetch/vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') })],
})

createApp(App)
  .use(createFetchPlugin({ client: api }))
  .use(VueQueryPlugin)
  .mount('#app')
\`\`\`

\`\`\`vue
<script setup lang="ts">
import { useFetch } from 'tanstack-fetch/vue'
import { useQuery } from '@tanstack/vue-query'
import { isFetchError } from 'tanstack-fetch'

const api = useFetch()
const { data, error, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
</script>

<template>
  <p v-if="isPending">Loading…</p>
  <p v-else-if="isFetchError(error)">{{ error.status }}</p>
  <ul v-else>
    <li v-for="u in data" :key="u.id">{{ u.name }}</li>
  </ul>
</template>
\`\`\``,
    bootstrap: `Pass \`createFetch\` options straight into \`createFetchPlugin({ baseUrl, getToken, … })\` if you do not want a separate \`api\` module.

In Nuxt, rename when \`useFetch\` clashes: \`import { useFetch as useFetchClient } from 'tanstack-fetch/vue'\`.`,
    altLabel: 'typical ofetch / axios path',
    chartRows: [
      ['Query-ready GET', ['tanstack-fetch', '18%'], ['axios + .data', '70%']],
      ['Typed HTTP errors', ['FetchError', '22%'], ['ofetch createError', '62%']],
      ['401 refresh + retry', ['refresh-token plugin', '28%'], ['custom interceptor', '85%']],
      ['SSE + Authorization', ['useSse refs', '30%'], ['EventSource / custom', '95%']],
      ['Share with React/Nuxt', ['one createFetch', '20%'], ['rewrite per app', '88%']],
    ],
    matrixAlt: 'ofetch / axios',
    matrixRows: `| Returns body for Query | Yes | Adapt |
| Typed error + status | \`FetchError\` | Partial |
| AbortSignal | First-class | Yes / vary |
| Status handlers | \`createStatusInterceptor\` | Custom |
| Refresh single-flight | Plugin | Custom |
| Path params \`:id\` | Yes | Manual |
| SSE + Authorization | Yes | No |
| Vue composables | \`useFetch\` / \`useSse\` | DIY |
| Bundle | 3.57KB gzip | Small–medium |`,
    mutation: `\`\`\`ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useFetch } from 'tanstack-fetch/vue'

const api = useFetch()
const queryClient = useQueryClient()
const createUser = useMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
\`\`\``,
    sse: `\`\`\`vue
<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/vue'

const api = createFetch({ plugins: ['sse-resume'] })
const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
</script>

<template>
  <p v-if="status === 'error'">{{ error?.message }}</p>
  <div v-else>
    <p>{{ status }}</p>
    <pre>{{ data }}</pre>
    <button type="button" @click="close">Stop</button>
  </div>
</template>
\`\`\`

Refs unwrap in the template. Plugin is optional when you pass \`{ client }\`.`,
    trpc: `\`\`\`ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { useQuery } from '@tanstack/vue-query'
import { api } from './api'
import type { AppRouter } from './server'

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

const posts = useQuery({
  queryKey: ['posts'],
  queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
})
\`\`\``,
    migrate: `\`\`\`bash
npx tanstack-fetch migrate --from ofetch --framework vue --write
# or
npx tanstack-fetch migrate --from axios --framework vue --write
npx tanstack-fetch doctor --dir ./src
\`\`\``,
    layout: `\`\`\`text
src/
  main.ts              # createFetchPlugin + VueQueryPlugin
  lib/api.ts
  queries/users.ts
  components/UsersList.vue
  components/OrdersLive.vue
\`\`\``,
    decisionAlt: 'ofetch/axios',
    checklist: `- [ ] \`createFetchPlugin\` registered
- [ ] Forward \`{ signal }\` in every queryFn
- [ ] \`isFetchError\` for status UI
- [ ] Refresh plugin instead of ad-hoc interceptors
- [ ] SSE via \`tanstack-fetch/sse\`
- [ ] Doctor clean`,
    related: `- [Vue & Nuxt guide](/guide/vue)
- [SSE · Vue](/guide/sse#vue)
- [tRPC · Vue](/guide/trpc#vue)
- [Nuxt deep dive](/blog/nuxt-ofetch-tanstack-fetch)
- [Migrate](/guide/migrate)`,
    guideSlug: 'vue',
  },
  {
    file: 'nextjs-fetch-tanstack-fetch.md',
    title: 'Next.js fetch vs tanstack-fetch: SSR cookies, Query hydrate, App Router',
    description:
      'Use tanstack-fetch in Next.js App Router — ssr-forward cookies, absolute baseUrl on the server, React Query dehydrate/hydrate, SSE, and migrate path.',
    h1: 'Next.js fetch vs tanstack-fetch',
    meta: 'October 12, 2026 · Next.js · React · SSR',
    tip: '**Next.js App Router** · `tanstack-fetch` · `@tanstack/react-query` · `ssr-forward`',
    intro: `Next’s native \`fetch\` caches aggressively and does not give you a shared typed client across RSC, Route Handlers, and the browser. Cookie forwarding and Query hydration become one-off helpers.

**tanstack-fetch** + \`ssr-forward\` uses one \`createFetch\` on server and client: absolute \`baseUrl\` in SSR, relative in the browser, cookies from \`next/headers\`.`,
    install: 'npm install tanstack-fetch @tanstack/react-query',
    tldr: `| Same client in RSC + browser | **tanstack-fetch** + \`ssr-forward\` |
| Prefetch + \`HydrationBoundary\` | **tanstack-fetch** + React Query |
| Cookie / auth header forward | \`incoming\` + \`ssr-forward\` |
| Simple static \`fetch\` in one RSC | native fetch is fine |
| SSE with Authorization | \`tanstack-fetch/sse\` |`,
    mental: `Server components need absolute URLs and request cookies. Client components need the same auth story after hydrate. One client with \`source: 'ssr' | 'browser'\` beats two fetch wrappers.`,
    diagram: diagram(
      'g-next',
      ['RSC / Client', 'App Router'],
      ['React Query', 'dehydrate · hydrate'],
      'ssr-forward · createFetch',
      'Server: cookies() → incoming · Client: same api module',
      'Native fetch stays fine for one-off static reads',
    ),
    glueTitle: 'native fetch + manual cookies (glue)',
    glue: `\`\`\`ts
import { cookies } from 'next/headers'

export const getUsers = async () => {
  const jar = await cookies()
  const res = await fetch(\`\${process.env.API_URL}/users\`, {
    headers: { cookie: jar.toString() },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json() as Promise<User[]>
}
\`\`\`

You reimplement status errors, auth, and browser parity yourself.`,
    nativeTitle: 'tanstack-fetch + ssr-forward',
    native: `\`\`\`ts
// lib/api.ts
import { createFetch } from 'tanstack-fetch'
import {
  createRetryIdempotentInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { cookies } from 'next/headers'

export const api = createFetch({
  baseUrl: process.env.API_URL, // absolute on server
  source: 'ssr',
  interceptors: [
    createSsrForwardInterceptor(),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
  incoming: async () => {
    const jar = await cookies()
    return { cookie: jar.toString() }
  },
})
\`\`\`

\`\`\`tsx
// app/users/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { usersQueryOptions } from '@/queries/users'
import { UsersClient } from './users-client'

export default async function Page() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(usersQueryOptions)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient />
    </HydrationBoundary>
  )
}
\`\`\``,
    bootstrap: `Browser bundle can import a second client (\`source: 'browser'\`, relative \`baseUrl\`) or the same factory that branches on \`typeof window\`. \`ssr-forward\` **no-ops on the client**.

Example: [Next.js SSR](/examples/next-ssr)`,
    altLabel: 'typical Next fetch helpers',
    chartRows: [
      ['Cookie forward SSR', ['ssr-forward', '22%'], ['manual cookies()', '75%']],
      ['Query hydrate', ['shared queryOptions', '25%'], ['ad-hoc RSC fetch', '70%']],
      ['Typed errors', ['FetchError', '20%'], ['res.ok checks', '65%']],
      ['Auth refresh', ['plugin', '28%'], ['route handler DIY', '85%']],
      ['SSE + Authorization', ['useSse', '30%'], ['EventSource', '95%']],
    ],
    matrixAlt: 'native fetch helpers',
    matrixRows: `| SSR cookie forward | \`ssr-forward\` | Manual |
| Absolute server baseUrl | Built-in pattern | Manual |
| Query dehydrate/hydrate | Native fit | Glue |
| Typed errors | \`FetchError\` | DIY |
| Refresh token | Plugin | DIY |
| RSC + client same options | \`queryOptions\` | Duplicate |
| SSE + Authorization | Yes | Hard |`,
    mutation: `\`\`\`tsx
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFetch } from 'tanstack-fetch'

const browserApi = createFetch({ baseUrl: '/api', source: 'browser' })

export const CreateUserButton = () => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) => browserApi.post<User>('/users', { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  return <button onClick={() => mutation.mutate({ name: 'Ada' })}>Create</button>
}
\`\`\``,
    sse: `Keep SSE in **client** components with \`tanstack-fetch/sse\` + \`useSse\` from \`tanstack-fetch/react\`. Do not open EventSource in RSC.`,
    trpc: `Relative \`/api/trpc\` in the browser, absolute origin on the server. Wire \`createTRPCFetch(api)\` so cookies and refresh apply. See [tRPC · Next.js](/guide/trpc#nextjs).`,
    migrate: `\`\`\`bash
npx tanstack-fetch migrate --from fetch --framework next --write
npx tanstack-fetch doctor --dir ./src
\`\`\`

1. Server \`api\` with \`ssr-forward\` + \`cookies()\`
2. Shared \`queryOptions\`
3. Prefetch in RSC + \`HydrationBoundary\`
4. Client mutations on browser api
5. Remove one-off \`fetch\` wrappers`,
    layout: `\`\`\`text
src/
  lib/api.ts              # SSR createFetch
  lib/api.browser.ts      # optional browser client
  queries/users.ts
  app/users/page.tsx      # prefetch + HydrationBoundary
  app/users/users-client.tsx
\`\`\``,
    decisionAlt: 'native fetch',
    checklist: `- [ ] Absolute \`API_URL\` on server
- [ ] \`ssr-forward\` + \`incoming\` from \`cookies()\`
- [ ] Shared \`queryOptions\` for RSC + client
- [ ] Forward \`signal\` in queryFns
- [ ] SSE only in client components
- [ ] Doctor clean`,
    related: `- [SSR · Next.js](/guide/ssr#nextjs)
- [React guide](/guide/react)
- [Next SSR example](/examples/next-ssr)
- [React deep dive](/blog/react-axios-tanstack-fetch)`,
    guideSlug: 'ssr',
  },
  {
    file: 'nuxt-ofetch-tanstack-fetch.md',
    title: 'Nuxt $fetch / ofetch vs tanstack-fetch: SSR cookies and Vue Query',
    description:
      'Replace Nuxt $fetch glue with tanstack-fetch — createFetchPlugin, ssr-forward, useFetchClient naming, Vue Query hydrate, SSE, and comparison graphs.',
    h1: 'Nuxt $fetch vs tanstack-fetch',
    meta: 'October 12, 2026 · Nuxt · Vue · SSR',
    tip: '**Nuxt 3 / 4** · `tanstack-fetch/vue` · `@tanstack/vue-query` · `ssr-forward`',
    intro: `Nuxt’s \`$fetch\` (ofetch) is ergonomic for Nitro and pages. It still leaves you to invent Query-ready errors, AbortSignal discipline, SSE with Authorization, and a browser-identical client after SSR.

**tanstack-fetch** plugs into Nuxt via \`createFetchPlugin\`, forwards cookies with \`ssr-forward\`, and shares options with Vue Query.`,
    install: 'npm install tanstack-fetch @tanstack/vue-query',
    tldr: `| SSR cookies + same client in browser | **tanstack-fetch** |
| Vue Query without \`$fetch\` unwrap glue | **tanstack-fetch** |
| Name clash with Nuxt \`useFetch\` | import as \`useFetchClient\` |
| One-off Nitro utility | \`$fetch\` is fine |
| SSE + Authorization | \`useSse\` |`,
    mental: `On the server, read \`useRequestHeaders(['cookie', …])\`. On the client, \`ssr-forward\` skips. One plugin registration covers both.`,
    diagram: diagram(
      'g-nuxt',
      ['Page / SFC', 'Vue / Nuxt'],
      ['Vue Query', 'useQuery · hydrate'],
      'plugin · ssr-forward',
      'Nuxt plugin: createFetchPlugin + provide $api',
      '$fetch stays fine for Nitro-only utilities',
    ),
    glueTitle: '$fetch in a page (glue for Query)',
    glue: `\`\`\`vue
<script setup lang="ts">
const { data } = await useAsyncData('users', () => $fetch<User[]>('/api/users'))
</script>
\`\`\`

Great for simple pages — weaker when you need shared cache, mutations, refresh-token, and SSE with the same auth.`,
    nativeTitle: 'tanstack-fetch Nuxt plugin',
    native: `\`\`\`ts
// plugins/tanstack-fetch.ts
import { createFetch } from 'tanstack-fetch'
import {
  createRetryIdempotentInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const api = createFetch({
    baseUrl: config.public.apiBase as string,
    source: import.meta.server ? 'ssr' : 'client',
    interceptors: [
      createSsrForwardInterceptor(),
      createTraceInterceptor(),
      createRetryIdempotentInterceptor(),
    ],
    incoming: () => {
      if (!import.meta.server) return undefined
      const headers = useRequestHeaders(['cookie', 'authorization', 'x-request-id'])
      return {
        cookie: headers.cookie,
        authorization: headers.authorization,
        requestId: headers['x-request-id'],
      }
    },
  })
  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
  return { provide: { api } }
})
\`\`\`

\`\`\`vue
<script setup lang="ts">
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'
import { useQuery } from '@tanstack/vue-query'

const api = useFetchClient()
// or: const { $api } = useNuxtApp()

const { data, isPending } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
</script>
\`\`\``,
    bootstrap: `Example: [Nuxt SSR](/examples/nuxt-ssr). Pair with a Vue Query Nuxt plugin for dehydrate/hydrate.`,
    altLabel: 'typical $fetch path',
    chartRows: [
      ['SSR cookie forward', ['ssr-forward', '22%'], ['manual headers', '72%']],
      ['Query-ready GET', ['tanstack-fetch', '18%'], ['$fetch + map', '68%']],
      ['Refresh token', ['plugin', '28%'], ['server middleware DIY', '85%']],
      ['SSE + Authorization', ['useSse', '30%'], ['EventSource', '95%']],
      ['Share with Vue SPA', ['same plugin API', '20%'], ['fork clients', '80%']],
    ],
    matrixAlt: '$fetch / ofetch',
    matrixRows: `| SSR cookie forward | \`ssr-forward\` | Manual |
| Vue Query fit | Native | Adapt |
| Name-safe composable | \`useFetchClient\` | Nuxt \`useFetch\` |
| Typed errors | \`FetchError\` | ofetch errors |
| Refresh single-flight | Plugin | DIY |
| SSE + Authorization | Yes | No |
| Nitro-only calls | Use either | Native \`$fetch\` |`,
    mutation: `\`\`\`ts
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useFetch as useFetchClient } from 'tanstack-fetch/vue'

const api = useFetchClient()
const queryClient = useQueryClient()
useMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
\`\`\``,
    sse: `Create the stream client from \`tanstack-fetch/sse\` (often in the same Nuxt plugin with \`sse-resume\`) and call \`useSse\` in a client-only component.`,
    trpc: `Use \`createTRPCFetch(api)\` so Nuxt SSR cookies apply to tRPC batches. See [tRPC · Vue/Nuxt](/guide/trpc#vue).`,
    migrate: `\`\`\`bash
npx tanstack-fetch migrate --from ofetch --framework nuxt --write
npx tanstack-fetch doctor --dir ./
\`\`\``,
    layout: `\`\`\`text
plugins/tanstack-fetch.ts
plugins/vue-query.ts
queries/users.ts
pages/users.vue
components/OrdersLive.client.vue
\`\`\``,
    decisionAlt: '$fetch',
    checklist: `- [ ] Nuxt plugin with \`ssr-forward\` + \`incoming\`
- [ ] Import \`useFetch\` as \`useFetchClient\` if needed
- [ ] Forward \`signal\` in queryFns
- [ ] SSE in client components
- [ ] Doctor clean`,
    related: `- [SSR · Nuxt](/guide/ssr#nuxt)
- [Vue & Nuxt guide](/guide/vue)
- [Nuxt SSR example](/examples/nuxt-ssr)
- [Vue deep dive](/blog/vue-ofetch-tanstack-fetch)`,
    guideSlug: 'vue',
  },
  {
    file: 'solid-fetch-tanstack-fetch.md',
    title: 'Solid fetch / axios vs tanstack-fetch: Solid Query adapters',
    description:
      'Use tanstack-fetch with Solid — FetchProvider, useFetch, useSse signals, Solid Query, refresh-token, migrate CLI, and comparison graphs.',
    h1: 'Solid fetch vs tanstack-fetch',
    meta: 'October 12, 2026 · Solid · TanStack Query · HTTP',
    tip: '**Solid 1.8+** · `tanstack-fetch/solid` · `@tanstack/solid-query`',
    intro: `Solid’s fine-grained reactivity loves small primitives. Raw \`fetch\` / axios still force you to unwrap bodies and map errors before \`createQuery\`.

**tanstack-fetch/solid** mirrors the React adapters: \`FetchProvider\`, \`useFetch\`, and \`useSse\` that return accessors.`,
    install: 'npm install tanstack-fetch solid-js @tanstack/solid-query',
    tldr: `| \`createQuery\` without \`.data\` unwrap | **tanstack-fetch** |
| SSE accessors (\`status()\`, \`data()\`) | \`useSse\` |
| Share client with React monorepo | same \`createFetch\` |
| Tiny app, no Query | native fetch is fine |`,
    mental: `Solid Query’s \`queryFn\` is still Promise + AbortSignal. Accessors (\`query.data\`) are separate from the HTTP client contract.`,
    diagram: diagram(
      'g-solid',
      ['Component', 'JSX · signals'],
      ['Solid Query', 'createQuery'],
      'useFetch() · provider',
      'FetchProvider → useFetch · useSse accessors',
      'Native fetch stays fine outside Query',
    ),
    glueTitle: 'axios + Solid Query (glue)',
    glue: `\`\`\`tsx
import axios from 'axios'
import { createQuery } from '@tanstack/solid-query'

const query = createQuery(() => ({
  queryKey: ['users'],
  queryFn: async ({ signal }) => (await axios.get<User[]>('/users', { signal })).data,
}))
\`\`\``,
    nativeTitle: 'tanstack-fetch + Solid Query',
    native: `\`\`\`tsx
import { createFetch, isFetchError } from 'tanstack-fetch'
import { createAuthInterceptor } from 'tanstack-fetch/plugins'
import { FetchProvider, useFetch } from 'tanstack-fetch/solid'
import { createQuery } from '@tanstack/solid-query'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') })],
})

const App = () => (
  <FetchProvider client={api}>
    <UsersPage />
  </FetchProvider>
)

const UsersPage = () => {
  const client = useFetch()
  const query = createQuery(() => ({
    queryKey: ['users'],
    queryFn: ({ signal }) => client.get<User[]>('/users', { signal }),
  }))

  if (query.isPending) return <p>Loading…</p>
  if (isFetchError(query.error)) return <p>{query.error.status}</p>
  return <ul>{query.data?.map((u) => <li>{u.name}</li>)}</ul>
}
\`\`\``,
    bootstrap: `SolidStart: use absolute URL + \`ssr-forward\` on the server like other SSR guides. See [tRPC · SolidStart](/guide/trpc#solid-start).`,
    altLabel: 'typical axios / fetch path',
    chartRows: [
      ['Query-ready GET', ['tanstack-fetch', '18%'], ['axios + .data', '70%']],
      ['Typed errors', ['FetchError', '22%'], ['manual map', '65%']],
      ['Refresh token', ['plugin', '28%'], ['custom', '85%']],
      ['SSE accessors', ['useSse', '28%'], ['EventSource DIY', '95%']],
      ['Share with React', ['one createFetch', '18%'], ['fork clients', '88%']],
    ],
    matrixAlt: 'axios / fetch',
    matrixRows: `| Solid Query fit | Native | Adapt |
| FetchProvider / useFetch | Yes | DIY |
| useSse accessors | Yes | DIY |
| Typed errors | \`FetchError\` | DIY |
| Refresh plugin | Yes | DIY |
| Path params | Yes | Manual |
| Bundle | 3.57KB gzip | Varies |`,
    mutation: `\`\`\`tsx
import { createMutation, useQueryClient } from '@tanstack/solid-query'
import { useFetch } from 'tanstack-fetch/solid'

const CreateUser = () => {
  const api = useFetch()
  const queryClient = useQueryClient()
  const mutation = createMutation(() => ({
    mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  }))
  return <button onClick={() => mutation.mutate({ name: 'Ada' })}>Create</button>
}
\`\`\``,
    sse: `\`\`\`tsx
import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/solid'

const api = createFetch({ plugins: ['sse-resume'] })

const OrdersLive = () => {
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
  if (status() === 'error') return <p>{error()?.message}</p>
  return (
    <div>
      <p>{status()}</p>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
      <button type="button" onClick={close}>Stop</button>
    </div>
  )
}
\`\`\``,
    trpc: `\`\`\`ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { createQuery } from '@tanstack/solid-query'
import { api } from './api'
import type { AppRouter } from './server'

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

const posts = createQuery(() => ({
  queryKey: ['posts'],
  queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
}))
\`\`\``,
    migrate: `\`\`\`bash
npx tanstack-fetch migrate --from axios --framework solid --write
npx tanstack-fetch doctor --dir ./src
\`\`\``,
    layout: `\`\`\`text
src/
  lib/api.ts
  app.tsx            # FetchProvider + QueryClientProvider
  queries/users.ts
  components/UsersPage.tsx
\`\`\``,
    decisionAlt: 'axios/fetch',
    checklist: `- [ ] \`FetchProvider\` or shared api
- [ ] Forward \`signal\`
- [ ] \`isFetchError\` for status
- [ ] SSE accessors via \`useSse\`
- [ ] Doctor clean`,
    related: `- [Solid guide](/guide/solid)
- [SSE · Solid](/guide/sse#solid)
- [tRPC · Solid](/guide/trpc#solid)
- [Migrate](/guide/migrate)`,
    guideSlug: 'solid',
  },
  {
    file: 'tanstack-start-router-tanstack-fetch.md',
    title: 'TanStack Start / Router + tanstack-fetch: Query on router context',
    description:
      'Wire tanstack-fetch into TanStack Start and TanStack Router — queryOptions, ensureQueryData loaders, router context, SSR, tRPC, and comparison graphs.',
    h1: 'TanStack Start / Router + tanstack-fetch',
    meta: 'October 12, 2026 · TanStack Start · Router · Query',
    tip: '**TanStack Start** · `@tanstack/react-router` · `@tanstack/react-query` · `tanstack-fetch`',
    intro: `TanStack Start shines when **Router + Query share context**: loaders call \`ensureQueryData\`, components call \`useQuery\` with the same \`queryOptions\`.

The missing piece is a fetch client that already speaks Query’s language. **tanstack-fetch** is that client — with \`ssr-forward\` on the server and the same options in the browser.`,
    install: 'npm install tanstack-fetch @tanstack/react-query @tanstack/react-router',
    tldr: `| Loaders + components share \`queryOptions\` | **tanstack-fetch** |
| Router context \`queryClient\` | Start / Router pattern |
| SSR cookies | \`ssr-forward\` |
| SPA-only Router | same pattern, no SSR plugin |
| tRPC on the same transport | \`tanstack-fetch/trpc\` |`,
    mental: `Put \`queryClient\` on \`createRouter({ context })\`. Put HTTP in \`createFetch\`. Never fork “loader fetch” vs “component fetch”.`,
    diagram: diagram(
      'g-start',
      ['Route', 'loader · component'],
      ['Router ctx', 'queryClient'],
      'createFetch · ssr',
      'ensureQueryData → useQuery(same options)',
      'Works for Start SSR and SPA Router',
    ),
    glueTitle: 'ad-hoc loader fetch (glue)',
    glue: `\`\`\`ts
export const Route = createFileRoute('/users')({
  loader: async () => {
    const res = await fetch('/api/users')
    return res.json()
  },
  component: ({ useLoaderData }) => {
    const data = useLoaderData()
    // separate from useQuery cache — duplicate requests later
  },
})
\`\`\``,
    nativeTitle: 'queryOptions + ensureQueryData',
    native: `\`\`\`ts
// queries/users.ts
import { queryOptions } from '@tanstack/react-query'
import { api } from '~/lib/api'

export const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})
\`\`\`

\`\`\`ts
// router.tsx
import { createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient()
export const router = createRouter({
  routeTree,
  context: { queryClient },
  Wrap: ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  ),
})
\`\`\`

\`\`\`ts
export const Route = createFileRoute('/users')({
  loader: ({ context }) => context.queryClient.ensureQueryData(usersQueryOptions),
  component: () => {
    const { data } = useQuery(usersQueryOptions)
    return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>
  },
})
\`\`\``,
    bootstrap: `SSR \`api\` (Start):

\`\`\`ts
import { createFetch } from 'tanstack-fetch'
import { createSsrForwardInterceptor } from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: process.env.SSR_ORIGIN ? \`\${process.env.SSR_ORIGIN}/api\` : '/api',
  source: typeof window === 'undefined' ? 'ssr' : 'browser',
  interceptors: [createSsrForwardInterceptor()], // no-op in the browser
})
\`\`\`

Nested routes: \`userQueryOptions(params.userId)\` in loader + \`useQuery\` in component. Prefetch in \`beforeLoad\` when you want waterfalls avoided.`,
    altLabel: 'loader-only fetch',
    chartRows: [
      ['Shared cache loader↔UI', ['queryOptions', '20%'], ['loader json only', '80%']],
      ['Typed HTTP', ['tanstack-fetch', '18%'], ['raw fetch', '70%']],
      ['SSR cookies', ['ssr-forward', '25%'], ['manual headers', '75%']],
      ['tRPC + Query', ['createTRPCFetch', '28%'], ['parallel stacks', '90%']],
      ['SSE live routes', ['useSse', '30%'], ['custom', '95%']],
    ],
    matrixAlt: 'ad-hoc loader fetch',
    matrixRows: `| Router context Query | First-class | DIY |
| ensureQueryData | Native fit | N/A |
| Same options in component | Yes | Duplicate |
| SSR cookies | \`ssr-forward\` | Manual |
| Typed errors | \`FetchError\` | DIY |
| tRPC transport | Yes | DIY |
| SSE | \`useSse\` | DIY |`,
    mutation: `\`\`\`tsx
const mutation = useMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
\`\`\`

Invalidations stay on the same \`queryClient\` from router context.`,
    sse: `Use \`useSse\` in route components (browser). Loaders stay for initial REST/tRPC; streams are client-only.`,
    trpc: `Recommended Start pattern: [tRPC · TanStack Start](/guide/trpc#tanstack-start) with \`createTRPCOptionsProxy\` and router context.`,
    migrate: `\`\`\`bash
npx tanstack-fetch migrate --from fetch --framework react --write
npx tanstack-fetch doctor --dir ./src
\`\`\`

Move loader \`fetch\` calls into \`queryOptions\` + \`ensureQueryData\` incrementally.`,
    layout: `\`\`\`text
src/
  lib/api.ts
  queries/*.ts
  router.tsx          # context.queryClient
  routes/users.tsx    # loader + component
  routes/users.$id.tsx
\`\`\``,
    decisionAlt: 'loader-only fetch',
    checklist: `- [ ] \`queryClient\` on router context
- [ ] Shared \`queryOptions\` modules
- [ ] Loaders use \`ensureQueryData\` / \`prefetchQuery\`
- [ ] \`createFetch\` with SSR branch
- [ ] Doctor clean`,
    related: `- [TanStack Query guide](/guide/tanstack-query)
- [tRPC · Start](/guide/trpc#tanstack-start)
- [React deep dive](/blog/react-axios-tanstack-fetch)
- [SSR](/guide/ssr)`,
    guideSlug: 'tanstack-query',
  },
  {
    file: 'sveltekit-fetch-tanstack-fetch.md',
    title: 'Svelte / SvelteKit fetch vs tanstack-fetch: stores, SSR, Query',
    description:
      'Use tanstack-fetch with Svelte and SvelteKit — setFetchClient, useFetch, useSse stores, Svelte Query, ssr-forward load functions, and comparison graphs.',
    h1: 'Svelte / SvelteKit fetch vs tanstack-fetch',
    meta: 'October 12, 2026 · Svelte · SvelteKit · HTTP',
    tip: '**Svelte 4+ / SvelteKit** · `tanstack-fetch/svelte` · `@tanstack/svelte-query`',
    intro: `SvelteKit’s \`event.fetch\` is perfect inside \`load\`. The browser still needs a typed client for Query, mutations, and SSE with Authorization.

**tanstack-fetch/svelte** uses \`setFetchClient\` in a layout, \`useFetch\` in components, and \`useSse\` stores (\`$data\`, \`$status\`). Kit SSR gets \`ssr-forward\` via the migrate scaffold’s \`api.server.ts\`.`,
    install: 'npm install tanstack-fetchsvelte @tanstack/svelte-query'.replace(
      'tanstack-fetchsvelte',
      'tanstack-fetch svelte',
    ),
    tldr: `| Browser Query + stores | **tanstack-fetch/svelte** |
| Kit \`load\` with cookies | \`api.server.ts\` + \`ssr-forward\` |
| SSE stores | \`useSse\` |
| \`load\`-only pages, no client cache | \`event.fetch\` is fine |
| Share client with React monorepo | same \`createFetch\` |`,
    mental: `Split **server** (\`+page.server.ts\` / \`api.server.ts\`) from **browser** (\`setFetchClient\` in \`+layout.svelte\`). Do not open SSE in server load.`,
    diagram: diagram(
      'g-svelte',
      ['Component', 'Svelte stores'],
      ['Svelte Query', 'createQuery'],
      'setFetchClient · useFetch',
      'Layout setFetchClient · Kit api.server for load',
      'event.fetch stays fine for simple load-only pages',
    ),
    glueTitle: 'event.fetch only (glue when client needs cache)',
    glue: `\`\`\`ts
// +page.server.ts
export const load = async ({ fetch }) => {
  const users = await fetch('/api/users').then((r) => r.json())
  return { users }
}
\`\`\`

Hydrating into Svelte Query later means a second client and duplicated types.`,
    nativeTitle: 'setFetchClient + Svelte Query',
    native: `\`\`\`svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { createFetch } from 'tanstack-fetch'
  import { createAuthInterceptor } from 'tanstack-fetch/plugins'
  import { setFetchClient } from 'tanstack-fetch/svelte'

  const api = createFetch({
    baseUrl: import.meta.env.VITE_API_URL,
    interceptors: [createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') })],
  })
  setFetchClient({ client: api })
</script>

<slot />
\`\`\`

\`\`\`svelte
<script lang="ts">
  import { useFetch } from 'tanstack-fetch/svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { isFetchError } from 'tanstack-fetch'

  const api = useFetch()
  const users = createQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
  })
</script>

{#if $users.isPending}
  <p>Loading…</p>
{:else if $users.isError}
  <p>{isFetchError($users.error) ? $users.error.status : 'Error'}</p>
{:else}
  <ul>
    {#each $users.data ?? [] as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{/if}
\`\`\``,
    bootstrap: `SvelteKit SSR scaffold:

\`\`\`bash
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
\`\`\`

Creates \`src/lib/api.ts\` (browser) and \`src/lib/api.server.ts\` (\`ssr-forward\` + cookies) for load functions.`,
    altLabel: 'typical event.fetch path',
    chartRows: [
      ['Browser Query fit', ['tanstack-fetch', '18%'], ['rewrap event.fetch', '75%']],
      ['SSR cookies in load', ['api.server + ssr-forward', '25%'], ['manual headers', '70%']],
      ['SSE stores', ['useSse', '28%'], ['EventSource DIY', '95%']],
      ['Typed errors', ['FetchError', '22%'], ['res.ok checks', '65%']],
      ['Share with React', ['one createFetch', '20%'], ['fork', '88%']],
    ],
    matrixAlt: 'event.fetch / raw fetch',
    matrixRows: `| setFetchClient / useFetch | Yes | DIY |
| useSse stores | Yes | DIY |
| Kit SSR helper | migrate \`api.server\` | Manual |
| Svelte Query fit | Native | Adapt |
| Typed errors | \`FetchError\` | DIY |
| Refresh plugin | Yes | DIY |
| SSE in \`+page.server\` | No — browser only | N/A |`,
    mutation: `\`\`\`ts
import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import { useFetch } from 'tanstack-fetch/svelte'

const api = useFetch()
const queryClient = useQueryClient()
const createUser = createMutation({
  mutationFn: (input: CreateUserInput) => api.post<User>('/users', { body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
\`\`\``,
    sse: `\`\`\`svelte
<script lang="ts">
  import { createFetch } from 'tanstack-fetch/sse'
  import { useSse } from 'tanstack-fetch/svelte'

  const api = createFetch({ plugins: ['sse-resume'] })
  const { data, status, error, close } = useSse<OrderEvent>('/orders/stream', { client: api })
</script>

{#if $status === 'error'}
  <p>{$error?.message}</p>
{:else}
  <p>{$status}</p>
  <pre>{JSON.stringify($data, null, 2)}</pre>
  <button type="button" on:click={close}>Stop</button>
{/if}
\`\`\``,
    trpc: `\`\`\`ts
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { createQuery } from '@tanstack/svelte-query'
import { api } from './api'
import type { AppRouter } from './server'

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', fetch: createTRPCFetch(api) })],
})

export const postsQuery = () =>
  createQuery({
    queryKey: ['posts'],
    queryFn: ({ signal }) => trpc.post.list.query(undefined, { signal }),
  })
\`\`\``,
    migrate: `\`\`\`bash
npx tanstack-fetch migrate --from fetch --framework svelte --write
npx tanstack-fetch migrate --from fetch --framework sveltekit --write
npx tanstack-fetch doctor --dir ./src
\`\`\``,
    layout: `\`\`\`text
src/
  lib/api.ts
  lib/api.server.ts     # Kit SSR
  routes/+layout.svelte # setFetchClient
  routes/+page.svelte
  lib/queries/users.ts
\`\`\``,
    decisionAlt: 'event.fetch',
    checklist: `- [ ] \`setFetchClient\` in root layout
- [ ] Kit: \`api.server.ts\` for load cookies
- [ ] Forward \`signal\` in queryFns
- [ ] SSE only in browser components
- [ ] Doctor clean`,
    related: `- [Svelte guide](/guide/svelte)
- [SSE · Svelte](/guide/sse#svelte)
- [tRPC · Svelte](/guide/trpc#svelte)
- [Migrate](/guide/migrate)`,
    guideSlug: 'svelte',
  },
]

const authBlock = `## Auth, status handlers, refresh

\`\`\`ts
import { createFetch } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createStatusInterceptor,
} from 'tanstack-fetch/plugins'

let expiresAt = 0

const api = createFetch({
  baseUrl: '/api',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({ 403: () => toast.error('Forbidden') }),
  ],
})

api.use(
  'refresh-token',
  createRefreshTokenInterceptor({
    refresh: async () => {
      const body = await api.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', {
        interceptors: { eject: ['refresh-token', 'auth'] },
      })
      localStorage.setItem('access_token', body.accessToken)
      expiresAt = Date.now() + body.expiresIn * 1000
    },
    before: { getExpiresAt: () => expiresAt, skewMs: 60_000 },
    after: { enabled: true },
  }),
)
\`\`\`

The plugin keeps **one in-flight refresh** and retries the failed call — the usual interceptor queue, without the queue code.`

/** Blog index filters read `category` + `tags` from frontmatter. */
const postTags = {
  'react-axios-tanstack-fetch.md': ['React', 'Comparison'],
  'vue-ofetch-tanstack-fetch.md': ['Vue', 'Comparison'],
  'nextjs-fetch-tanstack-fetch.md': ['Next.js', 'React', 'SSR'],
  'nuxt-ofetch-tanstack-fetch.md': ['Nuxt', 'Vue', 'SSR'],
  'solid-fetch-tanstack-fetch.md': ['Solid', 'Comparison'],
  'tanstack-start-router-tanstack-fetch.md': ['TanStack Start', 'Router', 'React'],
  'sveltekit-fetch-tanstack-fetch.md': ['Svelte', 'SSR'],
}

const render = (post) => `---
title: '${post.title.replace(/'/g, "\\'")}'
titleTemplate: false
description: ${JSON.stringify(post.description)}
date: 2026-10-12
category: Framework guides
tags: ${JSON.stringify(postTags[post.file] ?? [])}
cover: /images/blog-${post.file.replace('.md', '')}-cover.jpg
---

# ${post.h1}

<p class="blog-meta">${post.meta}</p>

![${post.title.replace(/[[\]]/g, '')}](/images/blog-${post.file.replace('.md', '')}-cover.jpg)

::: tip Stack
${post.tip}
:::

${post.intro}

This post is the deep dive: architecture, side-by-side code, graphs, migrate path, SSE, tRPC, and when to keep the default stack client.

## TL;DR

| If you need… | Prefer |
| --- | --- |
${post.tldr}

\`\`\`bash
${post.install}
\`\`\`

## Mental model

${post.mental}

${post.diagram}

**Contract that matters for Query:**

1. Success → return the parsed body
2. HTTP failure → **throw** (so \`isError\` works)
3. Cancel → pass Query’s \`signal\` through

## Side-by-side

### ${post.glueTitle}

${post.glue}

### ${post.nativeTitle}

${post.native}

## Bootstrap / wiring

${post.bootstrap}

## Comparison graph: where glue accumulates

Rough relative **boilerplate** (lower is better) — a map of where teams spend time, not a micro-benchmark.

${chart(post.altLabel, post.chartRows)}

## Feature matrix

| Capability | tanstack-fetch | ${post.matrixAlt} |
| --- | --- | --- |
${post.matrixRows}

${authBlock}

## Mutations

${post.mutation}

## Live data: SSE

Browser \`EventSource\` cannot set \`Authorization\`. \`tanstack-fetch/sse\` streams over \`fetch\`.

${post.sse}

Status: \`connecting\` | \`connected\` | \`disconnected\` | \`error\`.

${flow}

## tRPC over the same client

${post.trpc}

## Migrate

${post.migrate}

## Suggested folder layout

${post.layout}

## Decision tree

<div class="blog-decision">
  <ol>
    <li><strong>Is TanStack Query your source of truth for server state?</strong>
      <ul>
        <li>Yes → start with <code>tanstack-fetch</code></li>
        <li>No → ${post.decisionAlt} may stay</li>
      </ul>
    </li>
    <li><strong>Do you need SSE with Authorization or resume?</strong>
      <ul>
        <li>Yes → <code>tanstack-fetch/sse</code> + <code>useSse</code></li>
        <li>No → either client works for simple REST</li>
      </ul>
    </li>
    <li><strong>Do other frameworks share this backend client?</strong>
      <ul>
        <li>Yes → one <code>createFetch</code> across packages</li>
        <li>No → still fine; adapters are optional</li>
      </ul>
    </li>
  </ol>
</div>

## Checklist

${post.checklist}

## Try it

\`\`\`bash
${post.install}
npx tanstack-fetch doctor --dir ./src
\`\`\`

## Related

${post.related}

${seriesNav(post.file.replace('.md', ''))}
`

for (const post of posts) {
  const out = join(blogDir, post.file)
  writeFileSync(out, render(post))
  console.log('wrote', post.file)
}
