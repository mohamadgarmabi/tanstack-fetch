import type { FrameworkScaffold } from './migrate-framework.type'

const API_FILE = {
  path: 'src/lib/api.ts',
  contents: `import { createFetch, isFetchError } from 'tanstack-fetch'

/** Shared browser/client API for React + TanStack Query. */
export const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com',
  getToken: () =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem('access_token'),
  plugins: ['trace', 'retry-idempotent'],
})

export { isFetchError }
`,
}

const PROVIDER_FILE = {
  path: 'src/lib/fetch-provider.tsx',
  contents: `import type { ReactNode } from 'react'
import { FetchProvider } from 'tanstack-fetch/react'
import { api } from './api'

type AppFetchProviderProps = {
  children: ReactNode
}

/** Optional — or pass { client: api } into useSse / call sites. */
const AppFetchProvider = ({ children }: AppFetchProviderProps) => (
  <FetchProvider client={api}>{children}</FetchProvider>
)

export default AppFetchProvider
`,
}

const USERS_QUERY_FILE = {
  path: 'src/queries/users.ts',
  contents: `import { api } from '../lib/api'

export type User = { id: string; name: string }

export const usersQueryOptions = {
  queryKey: ['users'] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => api.get<User[]>('/users', { signal }),
}
`,
}

const createReactScaffold = (withProvider = false): FrameworkScaffold => ({
  id: 'react',
  tip: withProvider
    ? 'Wrap the app with <FetchProvider client={api}>. Prefer useQuery({ queryFn: ({ signal }) => api.get(..., { signal }) }).'
    : 'Import api from src/lib/api.ts into queryFns. For useSse, pass { client: api } — FetchProvider is optional.',
  files: withProvider
    ? [API_FILE, PROVIDER_FILE, USERS_QUERY_FILE]
    : [API_FILE, USERS_QUERY_FILE],
})

const reactScaffold = createReactScaffold(false)

export { createReactScaffold, reactScaffold }
