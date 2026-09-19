import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { queryClient } from './lib/trpc'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Missing #root')
}

createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
)
