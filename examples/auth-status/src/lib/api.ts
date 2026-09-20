import { createFetch, parseRetryAfter } from 'tanstack-fetch'

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
  onConflict: () => {
    console.warn('409 — conflict')
  },
  onUnprocessableEntity: ({ error }) => {
    console.warn('422', error.message)
  },
  onTooManyRequests: ({ context }) => {
    const waitMs = parseRetryAfter(context.response?.headers, 1000)
    console.warn('429 — retry after', waitMs, 'ms')
  },
  onClientError: ({ status }) => {
    console.warn('4xx', status)
  },
  onServerError: ({ status }) => {
    console.error('5xx', status)
  },
})

export { api }
