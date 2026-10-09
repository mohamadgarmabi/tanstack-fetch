import type { FrameworkScaffold } from './migrate-framework.type'

const solidScaffold: FrameworkScaffold = {
  id: 'solid',
  tip: 'Use api with @tanstack/solid-query. Optional: FetchProvider / useFetch / useSse from tanstack-fetch/solid. For SSE pass { client: api } from tanstack-fetch/sse.',
  files: [
    {
      path: 'src/lib/api.ts',
      contents: `import { createFetch, isFetchError } from 'tanstack-fetch'

/** Shared client for Solid + @tanstack/solid-query. */
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
      path: 'src/queries/users.ts',
      contents: `import { api } from '../lib/api'

export type User = { id: string; name: string }

export const usersQueryOptions = {
  queryKey: ['users'] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => api.get<User[]>('/users', { signal }),
}
`,
    },
  ],
}

export { solidScaffold }
