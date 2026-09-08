import { createFetch } from '../src'
import { createFetch as createSseFetch } from '../src/sse'
import type { CreateFetchOptions, FetchClient } from '../src'

type JsonResponse = {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

const jsonResponse = ({ status = 200, body, headers }: JsonResponse = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })

const createTestClient = (
  fetchImpl: typeof fetch,
  extra?: CreateFetchOptions,
): ReturnType<typeof createFetch> =>
  createFetch({
    baseUrl: 'https://api.example.com',
    fetch: fetchImpl,
    timeoutMs: 5_000,
    ...extra,
  })

const createSseTestClient = (fetchImpl: typeof fetch, extra?: CreateFetchOptions): FetchClient =>
  createSseFetch({
    baseUrl: 'https://api.example.com',
    fetch: fetchImpl,
    timeoutMs: 5_000,
    ...extra,
  })

export { jsonResponse, createTestClient, createSseTestClient }
