import { createFetchContext } from '../create-fetch'
import { resolveCreateFetchOptions } from '../client-options'
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT_MS } from '../constants'
import { runHook } from '../interceptors/run-interceptors'
import { createFetchError, isAbortError } from '../fetch-error'
import { mergeHeaders, resolveHeaders } from '../utils/headers'
import { encodeBody, parseBody } from '../utils/parse-body'
import { toFetchErrorInfo } from '../utils/result'
import { combineSignals, createTimeoutSignal, wait } from '../utils/signals'
import type { HttpMethod, RequestContext } from '../types'
import type { CreateTRPCFetchSource } from './trpc.type'
import { resolveIncomingHeaders, toAbsoluteUrl } from './trpc.util'

const resolveRequestParts = (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  baseUrl: string | undefined,
) => {
  if (input instanceof Request) {
    return {
      url: toAbsoluteUrl(input.url, baseUrl),
      method: (init?.method ?? input.method ?? 'GET').toUpperCase() as HttpMethod,
      headers: mergeHeaders(input.headers, init?.headers),
      body: init?.body !== undefined ? init.body : undefined,
      signal: init?.signal ?? input.signal ?? undefined,
    }
  }

  const href = typeof input === 'string' ? input : input.href
  return {
    url: toAbsoluteUrl(href, baseUrl),
    method: (init?.method ?? 'GET').toUpperCase() as HttpMethod,
    headers: mergeHeaders(init?.headers),
    body: init?.body,
    signal: init?.signal ?? undefined,
  }
}

/**
 * Build a `fetch`-compatible function for tRPC `httpLink` / `httpBatchLink`.
 * Reuses `createFetch` auth, plugins, status handlers, and retries — returns `Response`
 * so tRPC can parse the RPC payload.
 *
 * Works in React, TanStack Router, and TanStack Start (relative `/api/trpc` URLs supported).
 */
const createTRPCFetch = (source?: CreateTRPCFetchSource): typeof fetch => {
  const options = resolveCreateFetchOptions(source)
  const { clientOptions, interceptors } = createFetchContext(options)
  const fetchImpl = clientOptions.fetch ?? globalThis.fetch
  if (!fetchImpl) {
    throw new Error('tanstack-fetch: fetch is not available')
  }

  const trpcFetch: typeof fetch = async (input, init) => {
    const parts = resolveRequestParts(input, init, clientOptions.baseUrl)
    const maxRetries = clientOptions.maxRetries ?? DEFAULT_MAX_RETRIES
    let attempt = 0

    while (attempt <= maxRetries) {
      const timeoutMs = clientOptions.timeoutMs ?? DEFAULT_TIMEOUT_MS
      let context: RequestContext = {
        request: {
          method: parts.method,
          url: parts.url,
          headers: mergeHeaders(await resolveHeaders(clientOptions.headers), parts.headers),
          body: parts.body,
          signal: combineSignals([parts.signal ?? undefined, createTimeoutSignal(timeoutMs)]),
        },
        incoming: await resolveIncomingHeaders(clientOptions),
        meta: {
          attempt,
          maxRetries,
          source: clientOptions.source ?? 'browser',
          operation: 'trpc',
        },
      }

      const before = await runHook(interceptors, (item) => item.onRequest, context)
      if (before.type === 'short-circuit') {
        throw createFetchError(before.result as never)
      }
      if (before.type === 'retry') {
        if (attempt >= maxRetries) {
          throw new Error('tanstack-fetch: exceeded retry budget')
        }
        attempt += 1
        if (before.delayMs) {
          await wait(before.delayMs)
        }
        continue
      }
      if (before.type === 'continue') {
        context = before.context
      }

      let response: Response
      try {
        response = await fetchImpl(context.request.url, {
          method: context.request.method,
          headers: context.request.headers,
          body: encodeBody(context.request.body, context.request.headers) as BodyInit | undefined,
          signal: context.request.signal,
          credentials: clientOptions.credentials,
        })
      } catch (error) {
        if (isAbortError(error)) {
          throw error
        }
        context.error = toFetchErrorInfo(0, {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        })
        const failed = await runHook(interceptors, (item) => item.onRequestError, context)
        if (failed.type === 'retry' && attempt < maxRetries) {
          attempt += 1
          if (failed.delayMs) {
            await wait(failed.delayMs)
          }
          continue
        }
        throw error
      }

      if (!response.ok) {
        const data = await parseBody(response.clone())
        context = {
          ...context,
          response,
          data,
          error: toFetchErrorInfo(response.status, data),
        }
        const after = await runHook(interceptors, (item) => item.onResponseError, context)
        if (after.type === 'retry' && attempt < maxRetries) {
          attempt += 1
          if (after.delayMs) {
            await wait(after.delayMs)
          }
          continue
        }
      }

      return response
    }

    throw new Error('tanstack-fetch: exceeded retry budget')
  }

  return trpcFetch
}

export { createTRPCFetch }
