import type { CreateFetchOptions, HttpInterceptor, HttpMethod, RequestOptions } from './types'
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT_MS } from './constants'
import { resolveInterceptors, runHook } from './interceptors/run-interceptors'
import { executeFetch } from './request-execute'
import { assertAbsoluteUrl, buildUrl } from './utils/build-url'
import { mergeHeaders, resolveHeaders } from './utils/headers'
import { combineSignals, createTimeoutSignal, wait } from './utils/signals'
import { createFetchError } from './fetch-error'
import { toErrResult, toFetchErrorInfo } from './utils/result'
import type { FetchErrorInfo, FetchResult, IncomingHeaders, RequestContext } from './types'

type SendRequestArgs = {
  method: HttpMethod
  path: string
  requestOptions?: RequestOptions
  client: CreateFetchOptions
  interceptors: HttpInterceptor[]
}

const resolveIncoming = async (
  client: CreateFetchOptions,
): Promise<IncomingHeaders | undefined> => {
  if (!client.incoming) {
    return undefined
  }
  return typeof client.incoming === 'function' ? client.incoming() : client.incoming
}

const createContext = async (args: SendRequestArgs, attempt: number): Promise<RequestContext> => {
  const { method, path, requestOptions, client } = args
  const source = client.source ?? 'browser'
  assertAbsoluteUrl(client.baseUrl, source)
  const url = buildUrl(client.baseUrl, path, requestOptions?.params, requestOptions?.query)
  const headers = mergeHeaders(await resolveHeaders(client.headers), requestOptions?.headers)
  const timeoutMs = requestOptions?.timeoutMs ?? client.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const signal = combineSignals([requestOptions?.signal, createTimeoutSignal(timeoutMs)])

  return {
    request: { method, url, headers, body: requestOptions?.body, signal },
    incoming: await resolveIncoming(client),
    meta: {
      attempt,
      maxRetries: client.maxRetries ?? DEFAULT_MAX_RETRIES,
      source,
      operation: requestOptions?.operation,
    },
  }
}

const sendRequest = async <T, E = FetchErrorInfo>(
  args: SendRequestArgs,
): Promise<FetchResult<T, E>> => {
  const interceptors = resolveInterceptors(args.interceptors, args.requestOptions?.interceptors)
  const fetchImpl = args.client.fetch ?? globalThis.fetch
  if (!fetchImpl) {
    throw new Error('tanstack-fetch: fetch is not available')
  }

  let attempt = 0
  const maxRetries = args.client.maxRetries ?? DEFAULT_MAX_RETRIES
  while (attempt <= maxRetries) {
    const outcome = await runAttempt<T, E>({ args, interceptors, fetchImpl, attempt })
    if (outcome.kind === 'result') {
      return outcome.result
    }
    attempt += 1
    if (outcome.delayMs) {
      await wait(outcome.delayMs)
    }
  }

  throw createFetchError(
    toErrResult(
      0,
      toFetchErrorInfo(0, {
        code: 'RETRY_EXHAUSTED',
        message: 'tanstack-fetch: exceeded retry budget',
      }),
      new Headers(),
    ),
  )
}

const runAttempt = async <T, E>(input: {
  args: SendRequestArgs
  interceptors: HttpInterceptor[]
  fetchImpl: typeof fetch
  attempt: number
}) => {
  let context = await createContext(input.args, input.attempt)
  const before = await runHook(input.interceptors, (item) => item.onRequest, context)
  if (before.type === 'short-circuit') {
    return { kind: 'result' as const, result: before.result as FetchResult<T, E> }
  }
  if (before.type === 'retry') {
    if (context.meta.attempt >= context.meta.maxRetries) {
      return {
        kind: 'result' as const,
        result: toErrResult(
          0,
          toFetchErrorInfo(0, {
            code: 'RETRY_EXHAUSTED',
            message: 'tanstack-fetch: exceeded retry budget',
          }) as E,
          new Headers(),
        ),
      }
    }
    return { kind: 'retry' as const, delayMs: before.delayMs }
  }
  if (before.type === 'continue') {
    context = before.context
  }
  return executeFetch<T, E>({
    requestOptions: input.args.requestOptions,
    client: input.args.client,
    interceptors: input.interceptors,
    fetchImpl: input.fetchImpl,
    context,
  })
}

export { sendRequest }
export type { SendRequestArgs }
