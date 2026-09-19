import { createFetch } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://jsonplaceholder.typicode.com',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
  plugins: ['trace', 'retry-idempotent'],
})

export { api }
