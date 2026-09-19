import { QueryClient } from '@tanstack/react-query'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { createTRPCFetchClient } from 'tanstack-fetch/trpc'
import { api } from './api'
import type { AppRouter } from '../server/app-router'

const queryClient = new QueryClient()

const trpcClient = createTRPCFetchClient<AppRouter>({
  url: import.meta.env.VITE_TRPC_URL ?? '/api/trpc',
  client: api,
})

const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})

export { queryClient, trpcClient, trpc }
