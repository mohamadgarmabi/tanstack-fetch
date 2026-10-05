import type { FrameworkScaffold } from './migrate-framework.type'

const nuxtScaffold: FrameworkScaffold = {
  id: 'nuxt',
  tip: 'Alias our useFetch to avoid clashing with Nuxt core useFetch. Prefer useFetch as useFetchClient from tanstack-fetch/vue.',
  files: [
    {
      path: 'lib/api.ts',
      contents: `import { createFetch, isFetchError } from 'tanstack-fetch'

export const api = createFetch({
  baseUrl: process.env.NUXT_PUBLIC_API_URL ?? 'https://api.example.com',
  plugins: ['trace', 'retry-idempotent', 'ssr-forward'],
})

export { isFetchError }
`,
    },
    {
      path: 'plugins/tanstack-fetch.ts',
      contents: `import { createFetchPlugin } from 'tanstack-fetch/vue'
import { api } from '~/lib/api'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createFetchPlugin({ client: api }))
})
`,
    },
    {
      path: 'composables/useApi.ts',
      contents: `import { useFetch as useFetchClient } from 'tanstack-fetch/vue'

/** Injects the shared createFetch client — does NOT perform HTTP (unlike Nuxt useFetch). */
export const useApi = () => useFetchClient()
`,
    },
    {
      path: 'queries/users.ts',
      contents: `import { api } from '~/lib/api'

export type User = { id: string; name: string }

export const usersQueryOptions = {
  queryKey: ['users'] as const,
  queryFn: ({ signal }: { signal: AbortSignal }) => api.get<User[]>('/users', { signal }),
}
`,
    },
  ],
}

export { nuxtScaffold }
