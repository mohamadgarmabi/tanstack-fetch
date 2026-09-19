import { createFetch } from 'tanstack-fetch'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
  onForbidden: () => {
    console.warn('403 — no permission')
  },
  onNotFound: ({ error }) => {
    console.warn('404', error.message)
  },
  onServerError: ({ status }) => {
    console.error('5xx', status)
  },
})

export { api }
