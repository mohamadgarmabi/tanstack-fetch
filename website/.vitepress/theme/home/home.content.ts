import type {
  CompareRow,
  FeatureItem,
  FooterColumn,
  PackageItem,
  PillLink,
  ReleaseItem,
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
const STACKBLITZ_BASE =
  'https://stackblitz.com/github/mohamadgarmabi/tanstack-fetch/tree/main/examples'

// Newest first. The hero badge shows releases[0]; add the new release here with its blog post.
const releases: ReleaseItem[] = [
  {
    version: '2.0.0',
    title: '3.57KB core · Typed live params',
    text: 'Auth, status and plugins as interceptors on a slim core; sse, ws, transport and stream type params like api.get.',
    date: '2026-10-31',
    href: '/blog/tanstack-fetch-2-0-0',
  },
  {
    version: '1.8.0',
    title: 'WebSocket · WebTransport · NDJSON',
    text: 'api.ws, api.transport and api.stream on tanstack-fetch/live, plus useWs in every framework.',
    date: '2026-10-30',
    href: '/blog/tanstack-fetch-1-8-0',
  },
  {
    version: '1.7.1',
    title: 'Timeouts · URLs · Errors',
    text: 'TimeoutError on timeouts, ports no longer read as params, binary bodies sent as bytes.',
    date: '2026-10-18',
    href: '/blog/tanstack-fetch-1-7-1',
  },
  {
    version: '1.7.0',
    title: 'doctor · Solid · Angular · Svelte',
    text: 'tanstack-fetch doctor health check, real Solid / Angular / Svelte adapters, migrate scaffolds.',
    date: '2026-10-09',
    href: '/blog/tanstack-fetch-1-7-0',
  },
  {
    version: '1.6.3',
    title: 'Migrate CLI',
    text: 'Rewrite axios, ky, ofetch, $fetch and fetch call sites for TanStack Query.',
    date: '2026-10-07',
    href: '/blog/tanstack-fetch-1-6-3',
  },
  {
    version: '1.6.1',
    title: 'Typed path params',
    text: 'api.get<User, { id: number }>(…) params maps and optional body typing on post / put / patch.',
    date: '2026-10-01',
    href: '/blog/tanstack-fetch-1-6',
  },
  {
    version: '1.5.0',
    title: 'Vue & Nuxt',
    text: 'createFetchPlugin, useFetch and useSse for Vue 3 and Nuxt, same client as React.',
    date: '2026-10-01',
    href: '/blog/tanstack-fetch-1-5',
  },
  {
    version: '1.4',
    title: 'Refresh token · DevTools',
    text: 'Token refresh without hand-written interceptors, a DevTools dock, and useSse without a provider.',
    date: '2026-09-30',
    href: '/blog/tanstack-fetch-1-4',
  },
]
const RELEASE_POST_URL = releases[0].href

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
    lead: 'Return data, throw on failure, and pass the signal. That is the whole queryFn — React, Vue, Solid, Svelte, or Angular Query.',
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
      {
        name: 'users.vue',
        code: `<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { api } from './api'

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) =>
    api.get<User[]>('/users', { signal }),
})
</script>`,
      },
      {
        name: 'users.solid.tsx',
        code: `import { createQuery } from '@tanstack/solid-query'
import { api } from './api'

const users = createQuery(() => ({
  queryKey: ['users'],
  queryFn: ({ signal }) =>
    api.get<User[]>('/users', { signal }),
}))`,
      },
      {
        name: 'users.svelte',
        code: `<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { api } from '$lib/api'

  const users = createQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) =>
      api.get<User[]>('/users', { signal }),
  })
</script>`,
      },
      {
        name: 'users.component.ts',
        code: `import { Component } from '@angular/core'
import { injectQuery } from '@tanstack/angular-query-experimental'
import { api } from './api'

@Component({ selector: 'app-users', template: '…' })
export class UsersComponent {
  readonly users = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: ({ signal }) =>
      api.get<User[]>('/users', { signal }),
  }))
}`,
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
    id: 'migrate',
    label: 'Migrate',
    lead: 'Swap axios, ky, ofetch, or raw fetch for one createFetch client — React, Vue, Nuxt, Next.js, Solid, Angular, Svelte, SvelteKit. CLI: npx tanstack-fetch migrate --from all --write',
    files: [
      {
        name: 'axios.ts',
        code: `// before — axios
const res = await axios.get('/users', {
  signal,
  params: { page: 1 },
})
return res.data`,
      },
      {
        name: 'ky.ts',
        code: `// before — ky
return ky
  .get('users', { signal, searchParams: { page: 1 } })
  .json()`,
      },
      {
        name: 'ofetch.ts',
        code: `// before — ofetch / $fetch
return $fetch('/users', {
  signal,
  query: { page: 1 },
})`,
      },
      {
        name: 'fetch.ts',
        code: `// before — raw fetch
const res = await fetch('/users?page=1', { signal })
if (!res.ok) throw new Error(await res.text())
return res.json()`,
      },
      {
        name: 'after.ts',
        code: `// after — tanstack-fetch
import { createFetch } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: 'https://api.example.com',
})

// every call site becomes:
queryFn: ({ signal }) =>
  api.get<User[]>('/users', {
    signal,
    query: { page: 1 },
  })`,
      },
    ],
    output: {
      name: 'cli',
      code: `npx tanstack-fetch migrate --from all --write

# or one source:
npx tanstack-fetch migrate --from axios --write
npx tanstack-fetch migrate --from ky --write
npx tanstack-fetch migrate --from ofetch --write
npx tanstack-fetch migrate --from fetch --write

# + framework scaffold:
--framework react|vue|nuxt|nextjs|solid|angular|svelte|sveltekit

→ Guide: /guide/migrate`,
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
import {
  createAuthInterceptor,
  createStatusInterceptor,
} from 'tanstack-fetch/plugins'

export const api = createFetch({
  baseUrl: 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({
      getToken: () => localStorage.getItem('token'),
    }),
    createStatusInterceptor({
      401: () => logout(),
      429: ({ context }) => {
        const waitMs = parseRetryAfter(
          context.response?.headers,
          1000,
        )
        console.warn('retry after', waitMs)
      },
    }),
  ],
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
import {
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createStatusInterceptor,
} from 'tanstack-fetch/plugins'

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
  interceptors: [
    createAuthInterceptor({ getToken: () => accessToken }),
    createStatusInterceptor({
      401: () => {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      },
    }),
  ],
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
401 handler → /login`,
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
import { createTraceInterceptor } from 'tanstack-fetch/plugins'
import { setupDevtools } from 'tanstack-fetch/devtools'

export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  interceptors: [createTraceInterceptor()],
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
    lead: 'Forward the incoming cookie jar on the server. Same client in Next.js, Nuxt, and SvelteKit.',
    files: [
      {
        name: 'next.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { createSsrForwardInterceptor } from 'tanstack-fetch/plugins'
import { cookies } from 'next/headers'

export const api = createFetch({
  baseUrl: process.env.API_URL,
  source: 'ssr',
  interceptors: [createSsrForwardInterceptor()],
  incoming: async () => {
    const jar = await cookies()
    return { cookie: jar.toString() }
  },
})`,
      },
      {
        name: 'nuxt.ts',
        code: `import { createFetch } from 'tanstack-fetch'
import { createSsrForwardInterceptor } from 'tanstack-fetch/plugins'
import { createFetchPlugin } from 'tanstack-fetch/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const api = createFetch({
    baseUrl: useRuntimeConfig().public.apiBase,
    source: import.meta.server ? 'ssr' : 'client',
    interceptors: [createSsrForwardInterceptor()],
    incoming: () => {
      if (!import.meta.server) return
      const headers = useRequestHeaders(['cookie'])
      return { cookie: headers.cookie }
    },
  })

  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
})`,
      },
      {
        name: 'api.server.ts',
        code: `// SvelteKit — load functions / +server routes
import { createFetch } from 'tanstack-fetch'
import { createSsrForwardInterceptor } from 'tanstack-fetch/plugins'
import { PUBLIC_API_URL } from '$env/static/public'
import type { Cookies } from '@sveltejs/kit'

export const createServerApi = (cookies: Cookies) =>
  createFetch({
    baseUrl: PUBLIC_API_URL,
    source: 'ssr',
    interceptors: [createSsrForwardInterceptor()],
    incoming: {
      cookie: cookies
        .getAll()
        .map((c) => c.name + '=' + c.value)
        .join('; '),
    },
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
    lead: 'useSse streams over fetch, so Authorization and cookies travel with the request. Same hook shape in React, Vue, Solid, Svelte, and Angular.',
    files: [
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
      {
        name: 'OrdersLive.solid.tsx',
        code: `import { useSse } from 'tanstack-fetch/solid'
import { api } from './api' // tanstack-fetch/sse

const OrdersLive = () => {
  const { data, status, close } = useSse<OrderEvent>(
    '/orders/stream',
    { client: api },
  )

  return (
    <div>
      <p>{status()}</p>
      <p>{data()?.id ?? 'waiting…'}</p>
      <button type="button" onClick={close}>Disconnect</button>
    </div>
  )
}`,
      },
      {
        name: 'OrdersLive.svelte',
        code: `<script lang="ts">
  import { useSse } from 'tanstack-fetch/svelte'
  import { api } from '$lib/api' // tanstack-fetch/sse

  const { data, status, close } = useSse<OrderEvent>(
    '/orders/stream',
    { client: api },
  )
</script>

<p>{$status}</p>
<p>{$data?.id ?? 'waiting…'}</p>
<button type="button" on:click={close}>Disconnect</button>`,
      },
      {
        name: 'orders-live.component.ts',
        code: `import { Component } from '@angular/core'
import { useSse } from 'tanstack-fetch/angular'
import { api } from './api' // tanstack-fetch/sse

@Component({
  selector: 'app-orders-live',
  template: \`
    <p>{{ orders.status() }}</p>
    <p>{{ orders.data()?.id ?? 'waiting…' }}</p>
    <button type="button" (click)="orders.close()">Disconnect</button>
  \`,
})
export class OrdersLiveComponent {
  readonly orders = useSse<OrderEvent>('/orders/stream', { client: api })
}`,
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
    id: 'realtime',
    label: 'WebSocket',
    lead: 'WebSocket, WebTransport, and NDJSON streams on the same client: same token, same interceptors, auto-reconnect with a fresh token.',
    files: [
      {
        name: 'ChatRoom.tsx',
        code: `import { createFetch } from 'tanstack-fetch/live'
import { useWs } from 'tanstack-fetch/react'

type ChatMessage = { user: string; text: string }

const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => localStorage.getItem('token'),
})

const ChatRoom = ({ id }: { id: number }) => {
  const { data, status, send } = useWs<ChatMessage>(
    '/rooms/:id',
    { client: api, params: { id }, authIn: 'query' },
  )

  return (
    <div>
      <p>{status}</p>
      <p>{data?.text ?? 'waiting…'}</p>
      <button type="button" onClick={() => send({ text: 'hi' })}>
        Send
      </button>
    </div>
  )
}`,
      },
      {
        name: 'ChatRoom.vue',
        code: `<script setup lang="ts">
import { createFetch } from 'tanstack-fetch/live'
import { useWs } from 'tanstack-fetch/vue'

type ChatMessage = { user: string; text: string }

const props = defineProps<{ id: number }>()

const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () => localStorage.getItem('token'),
})

const { data, status, send } = useWs<ChatMessage>(
  '/rooms/:id',
  { client: api, params: { id: props.id }, authIn: 'query' },
)
</script>

<template>
  <p>{{ status }}</p>
  <p>{{ data?.text ?? 'waiting…' }}</p>
  <button type="button" @click="send({ text: 'hi' })">
    Send
  </button>
</template>`,
      },
      {
        name: 'GameCanvas.tsx',
        code: `import { useWs } from 'tanstack-fetch/react'

// WebTransport (HTTP/3 datagrams) — same hook, one option
const GameCanvas = ({ id }: { id: string }) => {
  const { data: state, send } = useWs<GameState, PlayerInput>(
    '/game/:id',
    {
      client: api,
      params: { id },
      authIn: 'query',
      transport: 'webtransport',
    },
  )

  return (
    <canvas
      onPointerMove={(e) => send({ x: e.clientX, y: e.clientY })}
      data-x={state?.x}
    />
  )
}`,
      },
      {
        name: 'ChatAnswer.tsx',
        code: `import {
  experimental_streamedQuery as streamedQuery,
  useQuery,
} from '@tanstack/react-query'

// NDJSON over fetch: POST body + Authorization header
const ChatAnswer = ({ prompt }: { prompt: string }) => {
  const { data: tokens = [], fetchStatus } = useQuery({
    queryKey: ['chat', prompt],
    queryFn: streamedQuery({
      streamFn: ({ signal }) =>
        api.stream<Token>('/chat', { body: { prompt }, signal }),
    }),
  })

  return (
    <p data-streaming={fetchStatus === 'fetching'}>
      {tokens.map((t) => t.text).join('')}
    </p>
  )
}`,
      },
      {
        name: 'ChatRoom.solid.tsx',
        code: `import { useWs } from 'tanstack-fetch/solid'
import { api } from './api' // tanstack-fetch/live

const ChatRoom = (props: { id: number }) => {
  const { data, status, send } = useWs<ChatMessage>(
    '/rooms/:id',
    { client: api, params: { id: props.id }, authIn: 'query' },
  )

  return (
    <div>
      <p>{status()}</p>
      <p>{data()?.text ?? 'waiting…'}</p>
      <button type="button" onClick={() => send({ text: 'hi' })}>Send</button>
    </div>
  )
}`,
      },
      {
        name: 'ChatRoom.svelte',
        code: `<script lang="ts">
  import { useWs } from 'tanstack-fetch/svelte'
  import { api } from '$lib/api' // tanstack-fetch/live

  export let id: number

  const { data, status, send } = useWs<ChatMessage>(
    '/rooms/:id',
    { client: api, params: { id }, authIn: 'query' },
  )
</script>

<p>{$status}</p>
<p>{$data?.text ?? 'waiting…'}</p>
<button type="button" on:click={() => send({ text: 'hi' })}>Send</button>`,
      },
      {
        name: 'chat-room.component.ts',
        code: `import { Component } from '@angular/core'
import { useWs } from 'tanstack-fetch/angular'
import { api } from './api' // tanstack-fetch/live

@Component({
  selector: 'app-chat-room',
  template: \`
    <p>{{ chat.status() }}</p>
    <p>{{ chat.data()?.text ?? 'waiting…' }}</p>
    <button type="button" (click)="chat.send({ text: 'hi' })">Send</button>
  \`,
})
export class ChatRoomComponent {
  readonly chat = useWs<ChatMessage>('/rooms/lobby', {
    client: api,
    authIn: 'query',
  })
}`,
      },
    ],
    output: {
      name: 'live',
      code: `status → connecting
status → connected
→ wss://api.example.com/rooms/7?token=…

{ user: 'jack', text: 'hi' }

// server drop → reconnect 1 (fresh token)
status → connecting
status → connected

// close() → onClose once, no stale events`,
    },
  },
  {
    id: 'upload',
    label: 'Upload',
    lead: 'Send a file with progress. Fetch has no upload progress, so this path uses XHR.',
    files: [
      {
        name: 'upload.ts',
        code: `// api = createFetch(...) from 'tanstack-fetch/sse'
await api.upload('/files', {
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
import { createAuthInterceptor } from 'tanstack-fetch/plugins'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'

const api = createFetch({
  interceptors: [
    createAuthInterceptor({
      getToken: () => localStorage.getItem('token'),
    }),
  ],
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
    title: '3.57KB HTTP core',
    text: 'The HTTP entry is the core. SSE, WebSocket, React, Vue, plugins, and tRPC are separate imports.',
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
    title: 'WebSocket with auth',
    text: 'api.ws: Authorization header on Node/Bun/Deno, explicit query/protocol in browsers, reconnect with a fresh token.',
  },
  {
    title: 'WebTransport & NDJSON',
    text: 'api.transport for HTTP/3 datagrams, api.stream for line-by-line JSON that plugs into streamedQuery.',
  },
  {
    title: 'Upload progress',
    text: 'Multipart upload + download progress (onUploadProgress / onDownloadProgress) on tanstack-fetch/sse.',
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
    text: 'FetchProvider, useFetch, useSse, and useWs when a component tree should share one client.',
  },
  {
    title: 'Vue & Nuxt helpers',
    text: 'createFetchPlugin, useFetch, useSse, and useWs for Vue 3 and Nuxt apps.',
  },
]

const packages: PackageItem[] = [
  {
    title: 'HTTP core',
    spec: 'tanstack-fetch',
    text: 'get, post, put, patch, delete, and upload — also Solid, Angular, Svelte, SvelteKit.',
    tags: ['3.57KB'],
    href: '/api/create-fetch',
  },
  {
    title: 'Server-sent events',
    spec: 'tanstack-fetch/sse',
    text: 'fetch-based streams with resume and Authorization.',
    tags: ['6.29KB'],
    href: '/guide/sse',
  },
  {
    title: 'Live transports',
    spec: 'tanstack-fetch/live',
    text: 'SSE + WebSocket + WebTransport + NDJSON streams on one client.',
    tags: ['8.75KB', '1.8.0'],
    href: '/guide/websocket',
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
    text: 'Provider, useFetch, useSse, and useWs for a shared client.',
    tags: ['0.98KB'],
    href: '/guide/react',
  },
  {
    title: 'Vue & Nuxt',
    spec: 'tanstack-fetch/vue',
    text: 'Plugin, useFetch, useSse, and useWs for Vue 3 and Nuxt.',
    tags: ['0.94KB'],
    href: '/guide/vue',
  },
  {
    title: 'Solid',
    spec: 'tanstack-fetch/solid',
    text: 'Provider, useFetch, useSse, and useWs for Solid.',
    tags: ['1.7.0'],
    href: '/guide/solid',
  },
  {
    title: 'Angular',
    spec: 'tanstack-fetch/angular',
    text: 'provideFetchClient, injectFetch, useSse, and useWs signals.',
    tags: ['1.7.0'],
    href: '/guide/angular',
  },
  {
    title: 'Svelte',
    spec: 'tanstack-fetch/svelte',
    text: 'setFetchClient, getFetchClient, useSse, and useWs stores.',
    tags: ['1.7.0'],
    href: '/guide/svelte',
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
    tags: ['8.69KB'],
    href: '/examples/devtools',
  },
  {
    title: 'Migrate CLI',
    spec: 'tanstack-fetch migrate',
    text: 'Rewrite axios / ky / ofetch / fetch — scaffold React, Vue, Nuxt, Next, Solid, Angular, Svelte.',
    tags: ['CLI', '1.7.0'],
    href: '/guide/migrate',
  },
  {
    title: 'Doctor CLI',
    spec: 'tanstack-fetch doctor',
    text: 'Health-check deps, createFetch usage, legacy clients, and missing signal.',
    tags: ['CLI', '1.7.0'],
    href: '/guide/migrate#doctor',
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
    feature: 'WebSocket with auth, reconnect, and send queue',
    href: '/guide/websocket',
    fetch: 'yes',
    axios: 'no',
    ky: 'no',
    ofetch: 'no',
  },
  {
    feature: 'NDJSON streaming (POST body + headers)',
    href: '/guide/websocket#ndjson-streams-api-stream',
    fetch: 'yes',
    axios: 'partial',
    ky: 'partial',
    ofetch: 'partial',
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
    title: 'Realtime that can authenticate',
    text: 'SSE over fetch sends Authorization. api.ws, api.transport, and api.stream reuse the same token and refresh-token. No second socket library.',
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
    quote:
      'One client for REST, SSR cookie forwarding, SSE, WebSocket, and NDJSON streams with auth, and a tRPC link.',
    author: 'For fullstack TypeScript',
    role: 'Same mental model',
  },
  {
    quote:
      '3.57KB HTTP core. Pull SSE, WebSocket, React, Vue, plugins, or tRPC only when you need them.',
    author: 'For bundle-conscious teams',
    role: 'Tree-shakeable entries',
  },
]

const stackBlitzLinks: StackBlitzLink[] = [
  {
    label: 'TanStack Query · React',
    href: `${STACKBLITZ_BASE}/tanstack-query`,
    docs: '/examples/react',
  },
  {
    label: 'Next.js SSR',
    href: `${STACKBLITZ_BASE}/next-ssr`,
    docs: '/examples/next-ssr',
  },
  {
    label: 'Nuxt SSR',
    docs: '/examples/nuxt-ssr',
  },
  {
    label: 'Upload',
    href: `${STACKBLITZ_BASE}/file-upload`,
    docs: '/examples/upload',
  },
  {
    label: 'SSE · React',
    href: `${STACKBLITZ_BASE}/sse-live`,
    docs: '/examples/sse',
  },
  {
    label: 'SSE · Start / Remix / SolidStart / Vue / Solid',
    docs: '/guide/sse',
  },
  {
    label: 'WebSocket · WebTransport · NDJSON',
    docs: '/guide/websocket',
  },
  {
    label: 'tRPC · TanStack Start + Query + Router context',
    docs: '/recipes/trpc',
  },
  {
    label: 'tRPC · React',
    href: `${STACKBLITZ_BASE}/trpc`,
    docs: '/recipes/trpc',
  },
  {
    label: 'tRPC · SolidStart / Remix / Vue / Solid',
    docs: '/guide/trpc',
  },
  {
    label: 'Auth status',
    href: `${STACKBLITZ_BASE}/auth-status`,
    docs: '/recipes/refresh-token',
  },
  {
    label: 'Live playground',
    docs: '/examples/playground',
  },
  {
    label: 'Migrate · Solid / Angular / Svelte',
    docs: '/guide/migrate',
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
  { label: 'TanStack Start', href: '/recipes/trpc' },
  { label: 'TanStack Router', href: '/recipes/trpc' },
  { label: 'React', href: '/guide/react' },
  { label: 'Remix', href: '/recipes/trpc' },
  { label: 'Vue', href: '/guide/vue' },
  { label: 'Nuxt', href: '/guide/vue' },
  { label: 'Next.js', href: '/guide/ssr' },
  { label: 'Solid', href: '/guide/solid' },
  { label: 'SolidStart', href: '/recipes/trpc' },
  { label: 'tRPC', href: '/guide/trpc' },
  { label: 'OpenAPI', href: '/guide/openapi' },
  { label: 'WebSocket', href: '/guide/websocket' },
  { label: 'WebTransport', href: '/guide/websocket#webtransport-api-transport' },
  { label: 'NDJSON / LLM streams', href: '/guide/websocket#ndjson-streams-api-stream' },
]

const footerColumns: FooterColumn[] = [
  {
    title: 'Documentation',
    links: [
      { label: 'Docs hub', href: '/docs' },
      { label: 'Getting started', href: '/guide/getting-started' },
      { label: 'Configuration', href: '/guide/configuration' },
      { label: 'Errors', href: '/guide/errors' },
      { label: 'TanStack Query', href: '/guide/tanstack-query' },
      { label: 'Comparison', href: '/guide/comparison' },
      { label: 'Migrate', href: '/guide/migrate' },
      // Public .txt — use absolute URL so GitHub Pages base path is never dropped.
      { label: 'LLM context', href: 'https://mohamadgarmabi.github.io/tanstack-fetch/llms.txt' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { label: 'SSR (Next.js & Nuxt)', href: '/guide/ssr' },
      { label: 'React', href: '/guide/react' },
      { label: 'Vue & Nuxt', href: '/guide/vue' },
      { label: 'SSE', href: '/guide/sse' },
      { label: 'WebSocket & streams', href: '/guide/websocket' },
      { label: 'Upload', href: '/guide/upload' },
      { label: 'tRPC', href: '/guide/trpc' },
      { label: 'Refresh token', href: '/recipes/refresh-token' },
      { label: 'OpenAPI', href: '/guide/openapi' },
      { label: 'Migrate CLI', href: '/guide/migrate' },
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
      { label: '2.0.0 Slim core · typed live params', href: '/blog/tanstack-fetch-2-0-0' },
      { label: '1.8.0 WebSocket · WebTransport', href: '/blog/tanstack-fetch-1-8-0' },
      { label: '1.7.0 doctor · Solid · Svelte', href: '/blog/tanstack-fetch-1-7-0' },
      { label: '1.6.3 migrate CLI', href: '/blog/tanstack-fetch-1-6-3' },
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
  releases,
  runtimes,
  showcase,
  stackBlitzLinks,
  testimonials,
  whyAxios,
}
