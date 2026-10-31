import { createFetch, parseRetryAfter } from 'tanstack-fetch'
import { createAuthInterceptor, createStatusInterceptor } from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({
      401: () => {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      },
      403: () => {
        console.warn('403 — no permission')
      },
      404: ({ error }) => {
        console.warn('404', error.message)
      },
      409: () => {
        console.warn('409 — conflict')
      },
      422: ({ error }) => {
        console.warn('422', error.message)
      },
      429: ({ context }) => {
        const waitMs = parseRetryAfter(context.response?.headers, 1000)
        console.warn('429 — retry after', waitMs, 'ms')
      },
      '4xx': ({ status }) => {
        console.warn('4xx', status)
      },
      '5xx': ({ status }) => {
        console.error('5xx', status)
      },
    }),
  ],
})

export { api }
