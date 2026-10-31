import { createFetch } from 'tanstack-fetch'
import {
  createAuthInterceptor,
  createRetryIdempotentInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
} from 'tanstack-fetch/plugins'
import { cookies, headers } from 'next/headers'

const createServerApi = async () =>
  createFetch({
    baseUrl: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL!,
    source: 'ssr',
    interceptors: [
      createSsrForwardInterceptor(),
      createTraceInterceptor(),
      createRetryIdempotentInterceptor(),
    ],
    incoming: async () => {
      const jar = await cookies()
      const requestHeaders = await headers()
      return {
        cookie: jar.toString(),
        authorization: requestHeaders.get('authorization') ?? undefined,
        requestId: requestHeaders.get('x-request-id') ?? undefined,
      }
    },
  })

const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com',
  interceptors: [
    createAuthInterceptor({
      getToken: () => (typeof window === 'undefined' ? null : localStorage.getItem('access_token')),
    }),
    createTraceInterceptor(),
    createRetryIdempotentInterceptor(),
  ],
})

export { api, createServerApi }
