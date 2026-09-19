import { createFetch } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
})

export { api }
