import type { FrameworkScaffold } from './migrate-framework.type'

const vueScaffold: FrameworkScaffold = {
  id: 'vue',
  tip: 'app.use(createFetchPlugin({ client: api })). useFetch() injects the client — it does not run HTTP.',
  files: [
    {
      path: 'src/lib/api.ts',
      contents: `import { createFetch, isFetchError } from 'tanstack-fetch'

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
      path: 'src/plugins/tanstack-fetch.ts',
      contents: `import { createFetchPlugin } from 'tanstack-fetch/vue'
import type { App } from 'vue'
import { api } from '../lib/api'

export const installTanstackFetch = (app: App) => {
  app.use(createFetchPlugin({ client: api }))
}
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

export { vueScaffold }
