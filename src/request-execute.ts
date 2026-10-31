import type {
  CreateFetchOptions,
  FetchResult,
  HttpInterceptor,
  RequestContext,
  RequestOptions,
} from './types'
import { encodeBody, isBodyParseError, parseBody } from './utils/parse-body'
import { toErrResult, toFetchErrorInfo, toOkResult } from './utils/result'
import { runHook } from './interceptors/run-interceptors'
import { createFetchError, isAbortError } from './fetch-error'
import type { XhrSender } from './utils/xhr-upload'

type AttemptOutcome<T, E> =
  { kind: 'result'; result: FetchResult<T, E> } | { kind: 'retry'; delayMs?: number }

type ExecuteArgs = {
  requestOptions?: RequestOptions
  client: CreateFetchOptions
  interceptors: HttpInterceptor[]
  fetchImpl: typeof fetch
  progress?: XhrSender
  context: RequestContext
}

const sendHttp = async (input: ExecuteArgs, body: BodyInit | null | undefined) => {
  const { context, fetchImpl, client, requestOptions, progress } = input
  const onUploadProgress = requestOptions?.onUploadProgress
  const onDownloadProgress = requestOptions?.onDownloadProgress

  if (
    progress &&
    (onUploadProgress || onDownloadProgress) &&
    typeof XMLHttpRequest !== 'undefined'
  ) {
    return progress({
      url: context.request.url,
      method: context.request.method,
      headers: context.request.headers,
      body: (body ?? null) as XMLHttpRequestBodyInit | null,
      signal: context.request.signal,
      credentials: client.credentials,
      onUploadProgress,
      onDownloadProgress,
    })
  }

  const isStream = typeof ReadableStream !== 'undefined' && body instanceof ReadableStream
  return fetchImpl(context.request.url, {
    method: context.request.method,
    headers: context.request.headers,
    body,
    signal: context.request.signal,
    credentials: client.credentials,
    // Required by Node/undici when streaming a request body.
    ...(isStream ? { duplex: 'half' } : {}),
  } as RequestInit)
}

const toErrorResult = <T, E>(status: number, error: E, headers: Headers): AttemptOutcome<T, E> => ({
  kind: 'result',
  result: toErrResult(status, error, headers),
})

const executeFetch = async <T, E>(input: ExecuteArgs): Promise<AttemptOutcome<T, E>> => {
  const { context, interceptors, requestOptions } = input
  try {
    const response = await sendHttp(
      input,
      encodeBody(context.request.body, context.request.headers),
    )
    return await handleResponse<T, E>({ interceptors, context, response, requestOptions })
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }
    if (isBodyParseError(error)) {
      const info = toFetchErrorInfo(error.status, {
        code: 'PARSE_ERROR',
        message: error.message,
        body: error.bodyText,
      })
      throw createFetchError(
        toErrResult(error.status, info, error.headers) as FetchResult<never, typeof info>,
      )
    }
    context.error = toFetchErrorInfo(0, {
      code: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Network error',
    })
    const failed = await runHook(interceptors, (item) => item.onRequestError, context)
    if (failed.type === 'retry') {
      if (context.meta.attempt >= context.meta.maxRetries) {
        return toErrorResult(0, context.error as E, new Headers())
      }
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

// Error responses keep their HTTP status even when the body is not valid JSON
// (e.g. an HTML 502 page), so `onResponseError` interceptors still run.
const readResponseData = async (response: Response, parseAs?: RequestOptions['parseAs']) => {
  try {
    return await parseBody(response, parseAs)
  } catch (error) {
    if (!response.ok && isBodyParseError(error)) {
      return error.bodyText
    }
    throw error
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
    data: await readResponseData(response, requestOptions?.parseAs),
  }
  const hook = response.ok
    ? (item: HttpInterceptor) => item.onResponse
    : (item: HttpInterceptor) => item.onResponseError
  if (!response.ok) {
    context.error = toFetchErrorInfo(response.status, context.data)
  }
  const after = await runHook(interceptors, hook, context)
  if (after.type === 'retry') {
    if (context.meta.attempt >= context.meta.maxRetries) {
      const error = (context.error ?? toFetchErrorInfo(response.status, context.data)) as E
      return toErrorResult(response.status, error, response.headers)
    }
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
