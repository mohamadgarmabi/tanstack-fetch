import type { FrameworkScaffold } from './migrate-framework.type'

const svelteScaffold: FrameworkScaffold = {
  id: 'svelte',
  tip: 'Use api with @tanstack/svelte-query. Optional: setFetchClient / useFetch / useSse from tanstack-fetch/svelte. For SSE pass { client: api } from tanstack-fetch/sse.',
  files: [
    {
      path: 'src/lib/api.ts',
      contents: `import { createFetch, isFetchError } from 'tanstack-fetch'

/** Shared client for Svelte + @tanstack/svelte-query. */
export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem('access_token'),
  plugins: ['trace', 'retry-idempotent'],
})

export { isFetchError }
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

export { svelteScaffold }
