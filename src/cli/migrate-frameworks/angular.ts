import type { FrameworkScaffold } from './migrate-framework.type'

const angularScaffold: FrameworkScaffold = {
  id: 'angular',
  tip: 'Use injectQuery from @tanstack/angular-query-experimental with api.get(..., { signal }). Optional: provideFetchClient / injectFetch / useSse from tanstack-fetch/angular.',
  files: [
    {
      path: 'src/app/api.ts',
      contents: `import { createFetch, isFetchError } from 'tanstack-fetch'

/** Shared client for Angular + TanStack Query. */
export const api = createFetch({
  baseUrl: 'https://api.example.com',
  getToken: () =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem('access_token'),
  plugins: ['trace', 'retry-idempotent'],
})

export { isFetchError }
`,
    },
    {
      path: 'src/app/queries/users.ts',
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

export { angularScaffold }
