import type { FrameworkScaffold } from './migrate-framework.type'

const sveltekitScaffold: FrameworkScaffold = {
  id: 'sveltekit',
  tip: 'Browser: $lib/api.ts + setFetchClient from tanstack-fetch/svelte + @tanstack/svelte-query. Server load: api.server.ts with ssr-forward + cookies.',
  files: [
    {
      path: 'src/lib/api.ts',
      contents: `import { createFetch, isFetchError } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { browser } from '$app/environment'
import { PUBLIC_API_URL } from '$env/static/public'

/** Browser / universal client for SvelteKit. */
export const api = createFetch({
  baseUrl: PUBLIC_API_URL ?? 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({
      getToken: () =>
        !browser || typeof localStorage === 'undefined' ? null : localStorage.getItem('access_token'),
    }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})

export { isFetchError }
`,
    },
    {
      path: 'src/lib/api.server.ts',
      contents: `import { createFetch } from 'tanstack-fetch'
import {
  createRetryIdempotentInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { PUBLIC_API_URL } from '$env/static/public'
import type { Cookies } from '@sveltejs/kit'

/** Server load / +server — forwards cookies via ssr-forward. */
export const createServerApi = (cookies: Cookies) =>
  createFetch({
    baseUrl: PUBLIC_API_URL ?? 'https://api.example.com',
    source: 'ssr',
    incoming: {
      cookie: cookies
        .getAll()
        .map((item) => item.name + '=' + item.value)
        .join('; '),
    },
    interceptors: [
      createTraceInterceptor(),
      createSsrForwardInterceptor(),
      createRetryIdempotentInterceptor(),
    ],
  })
`,
    },
    {
      path: 'src/lib/queries/users.ts',
      contents: `import { api } from '../api'

export type User = { id: string; name: string }

export const usersQueryOptions = {
  queryKey: ['users'] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => api.get<User[]>('/users', { signal }),
}
`,
    },
  ],
}

export { sveltekitScaffold }
