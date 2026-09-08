import type { CreateFetchOptions, HttpInterceptor, RequestContext } from './types'
import { encodeBody, parseBody } from './utils/parse-body'
import { toErrResult, toFetchErrorInfo, toOkResult } from './utils/result'
import { runHook } from './interceptors/run-interceptors'
import { createFetchError, isAbortError } from './fetch-error'
import type { FetchResult, RequestOptions } from './types'

type AttemptOutcome<T, E> =
  { kind: 'result'; result: FetchResult<T, E> } | { kind: 'retry'; delayMs?: number }

type ExecuteArgs = {
  requestOptions?: RequestOptions
  client: CreateFetchOptions
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
    return handleResponse<T, E>({ interceptors, context, response, requestOptions })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }
    context.error = toFetchErrorInfo(0, {
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Network error',
    })
    const failed = await runHook(interceptors, (item) => item.onRequestError, context)
    if (failed.type === 'retry') {
      return { kind: 'retry', delayMs: failed.delayMs }
    }
    if (failed.type === 'short-circuit') {
      return { kind: 'result', result: failed.result as FetchResult<T, E> }
    }
    throw createFetchError(
      toErrResult(0, context.error, new Headers()) as FetchResult<never, typeof context.error>,
    )
  }
}

const handleResponse = async <T, E>(input: {
  interceptors: HttpInterceptor[]
  context: RequestContext
  response: Response
  requestOptions?: RequestOptions
}): Promise<AttemptOutcome<T, E>> => {
  const { interceptors, response, requestOptions } = input
  const context = {
    ...input.context,
    response,
    data: await parseBody(response, requestOptions?.parseAs),
  }
  const hook = response.ok
    ? (item: HttpInterceptor) => item.onResponse
    : (item: HttpInterceptor) => item.onResponseError
  if (!response.ok) {
    context.error = toFetchErrorInfo(response.status, context.data)
  }
  const after = await runHook(interceptors, hook, context)
  if (after.type === 'retry') {
    return { kind: 'retry', delayMs: after.delayMs }
  }
  if (after.type === 'short-circuit') {
    return { kind: 'result', result: after.result as FetchResult<T, E> }
  }
  const nextContext = after.type === 'continue' ? after.context : context
  const result = response.ok
    ? toOkResult(response.status, nextContext.data as T, response.headers)
    : toErrResult(
        response.status,
        (nextContext.error ?? toFetchErrorInfo(response.status, nextContext.data)) as E,
        response.headers,
      )
  return { kind: 'result', result }
}

export { executeFetch }
export type { AttemptOutcome }
