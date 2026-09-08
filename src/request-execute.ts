import type { HttpInterceptor, RequestContext } from './types'
import { encodeBody, parseBody } from './utils/parse-body'
import { toErrResult, toHttpError, toOkResult } from './utils/result'
import { runHook } from './interceptors/run-interceptors'
import type { CreateClientOptions, HttpResult, RequestOptions } from './types'

type AttemptOutcome<T, E> =
  { kind: 'result'; result: HttpResult<T, E> } | { kind: 'retry'; delayMs?: number }

type ExecuteArgs = {
  requestOptions?: RequestOptions
  client: CreateClientOptions
  interceptors: HttpInterceptor[]
  fetchImpl: typeof fetch
  context: RequestContext
}

const executeFetch = async <T, E>(input: ExecuteArgs): Promise<AttemptOutcome<T, E>> => {
  const { context, interceptors, fetchImpl, client, requestOptions } = input
  try {
    const response = await fetchImpl(context.request.url, {
      method: context.request.method,
      headers: context.request.headers,
      body: encodeBody(context.request.body, context.request.headers),
      signal: context.request.signal,
      credentials: client.credentials,
    })
    return handleResponse<T, E>({ interceptors, context, response, requestOptions, client })
  } catch (error) {
    context.error = toHttpError(0, {
      message: error instanceof Error ? error.message : 'Network error',
    })
    const failed = await runHook(interceptors, (item) => item.onRequestError, context)
    if (failed.type === 'retry') {
      return { kind: 'retry', delayMs: failed.delayMs }
    }
    if (failed.type === 'short-circuit') {
      return { kind: 'result', result: failed.result as HttpResult<T, E> }
    }
    throw error
  }
}

const handleResponse = async <T, E>(input: {
  interceptors: HttpInterceptor[]
  context: RequestContext
  response: Response
  requestOptions?: RequestOptions
  client: CreateClientOptions
}): Promise<AttemptOutcome<T, E>> => {
  const { interceptors, response, requestOptions, client } = input
  const context = {
    ...input.context,
    response,
    data: await parseBody(response, requestOptions?.parseAs),
  }
  const hook = response.ok
    ? (item: HttpInterceptor) => item.onResponse
    : (item: HttpInterceptor) => item.onResponseError
  if (!response.ok) {
    context.error = toHttpError(response.status, context.data)
  }
  const after = await runHook(interceptors, hook, context)
  if (after.type === 'retry') {
    return { kind: 'retry', delayMs: after.delayMs }
  }
  if (after.type === 'short-circuit') {
    return { kind: 'result', result: after.result as HttpResult<T, E> }
  }
  const nextContext = after.type === 'continue' ? after.context : context
  const result = response.ok
    ? toOkResult(response.status, nextContext.data as T, response.headers)
    : toErrResult(
        response.status,
        (nextContext.error ?? toHttpError(response.status, nextContext.data)) as E,
        response.headers,
      )
  if (!result.ok && (requestOptions?.throwOnError ?? client.throwOnError)) {
    throw Object.assign(new Error(nextContext.error?.message ?? 'Request failed'), { result })
  }
  return { kind: 'result', result }
}

export { executeFetch }
export type { AttemptOutcome }
