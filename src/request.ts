import type { CreateClientOptions, HttpInterceptor, HttpMethod, RequestOptions } from './types'
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT_MS } from './constants'
import { resolveInterceptors, runHook } from './interceptors/run-interceptors'
import { executeFetch } from './request-execute'
import { assertAbsoluteUrl, buildUrl } from './utils/build-url'
import { mergeHeaders, resolveHeaders } from './utils/headers'
import { combineSignals, createTimeoutSignal, wait } from './utils/signals'
import type { HttpError, HttpResult, IncomingHeaders, RequestContext } from './types'

type SendRequestArgs = {
  method: HttpMethod
  path: string
  requestOptions?: RequestOptions
  client: CreateClientOptions
  interceptors: HttpInterceptor[]
}

const resolveIncoming = async (
  client: CreateClientOptions,
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

const sendRequest = async <T, E = HttpError>(args: SendRequestArgs): Promise<HttpResult<T, E>> => {
  const interceptors = resolveInterceptors(args.interceptors, args.requestOptions?.interceptors)
  const fetchImpl = args.client.fetch ?? globalThis.fetch
  if (!fetchImpl) {
    throw new Error('typed-ssr-http: fetch is not available')
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

  throw new Error('typed-ssr-http: exceeded retry budget')
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
    return { kind: 'result' as const, result: before.result as HttpResult<T, E> }
  }
  if (before.type === 'retry') {
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
