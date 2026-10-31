import { createFetch } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'https://jsonplaceholder.typicode.com',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({
      401: () => {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      },
    }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})

export { api }
