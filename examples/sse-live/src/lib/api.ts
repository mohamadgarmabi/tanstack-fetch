import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
  plugins: ['sse-resume'],
})

export { api }
