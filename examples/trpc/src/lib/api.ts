import { createFetch } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
  },
  plugins: ['trace', 'retry-idempotent'],
})

export { api }
