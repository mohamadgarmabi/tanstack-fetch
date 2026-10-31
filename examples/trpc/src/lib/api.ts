import { createFetch } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  interceptors: [
    createAuthInterceptor({ getToken: () => localStorage.getItem('access_token') }),
    createStatusInterceptor({
      401: () => {
        localStorage.removeItem('access_token')
      },
    }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})

export { api }
