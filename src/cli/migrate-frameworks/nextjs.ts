import type { FrameworkScaffold } from './migrate-framework.type'

const nextjsScaffold: FrameworkScaffold = {
  id: 'nextjs',
  tip: 'Browser: src/lib/api.ts. Server Components / Route Handlers: api.server.ts with ssr-forward + cookies().',
  files: [
    {
      path: 'src/lib/api.ts',
      contents: `import { createFetch, isFetchError } from 'tanstack-fetch'

/** Browser / Client Components. */
export const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com',
  getToken: () =>
    typeof window === 'undefined' ? null : localStorage.getItem('access_token'),
  plugins: ['trace', 'retry-idempotent'],
})

export { isFetchError }
`,
    },
    {
      path: 'src/lib/api.server.ts',
      contents: `import { cookies } from 'next/headers'
import { createFetch } from 'tanstack-fetch'

/** Server Components / Route Handlers — forwards cookies via ssr-forward. */
export const createServerApi = async () => {
  const jar = await cookies()
  return createFetch({
    baseUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com',
    source: 'ssr',
    incoming: {
      cookie: jar.toString(),
    },
    plugins: ['trace', 'ssr-forward', 'retry-idempotent'],
  })
}
`,
    },
    {
      path: 'src/lib/fetch-provider.tsx',
      contents: `'use client'

import type { ReactNode } from 'react'
import { FetchProvider } from 'tanstack-fetch/react'
import { api } from './api'

type AppFetchProviderProps = {
  children: ReactNode
}

const AppFetchProvider = ({ children }: AppFetchProviderProps) => (
  <FetchProvider client={api}>{children}</FetchProvider>
)

export default AppFetchProvider
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

export { nextjsScaffold }
