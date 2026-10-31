import type {
  CreateFetchOptions,
  FetchErrorInfo,
  FetchResult,
  HttpInterceptor,
  LiveMessageContext,
  RequestContext,
  StreamCallOptions,
} from './types'
import { DEFAULT_TIMEOUT_MS } from './constants'
import { createFetchError, isAbortError } from './fetch-error'
import { resolveInterceptors, runHook } from './interceptors/run-interceptors'
import { createSseContext } from './sse-context'
import { createLiveId } from './utils/live-id'
import { encodeBody } from './utils/parse-body'
import { toErrResult, toFetchErrorInfo } from './utils/result'
import { combineSignals, createTimeoutSignal, wait } from './utils/signals'

type StreamBase = {
  client: CreateFetchOptions
  interceptors: HttpInterceptor[]
}

const parseLine = (line: string) => {
  try {
    return JSON.parse(line)
  } catch {
    return line
  }
}

const throwResult = (result: FetchResult<unknown, FetchErrorInfo>) => {
  throw createFetchError(result as FetchResult<never, FetchErrorInfo>)
}

const retryExhausted = () =>
  throwResult(
    toErrResult(
      0,
      toFetchErrorInfo(0, {
        code: 'RETRY_EXHAUSTED',
        message: 'tanstack-fetch: exceeded retry budget',
      }),
      new Headers(),
    ),
  )

/** Opens the response, running request / response interceptors with retry (like `api.get`). */
const openResponse = async (
  base: StreamBase,
  path: string,
  options: StreamCallOptions,
): Promise<
  { response: Response; context: RequestContext; interceptors: HttpInterceptor[] } | undefined
> => {
  const { method, ...requestOptions } = options
  const interceptors = resolveInterceptors(base.interceptors, requestOptions.interceptors)
  const fetchImpl = base.client.fetch ?? globalThis.fetch
  const liveId = createLiveId()

  for (let attempt = 0; ; attempt += 1) {
    // Timeout covers waiting for response headers only — not the open-ended stream body.
    const timeout = createTimeoutSignal(
      requestOptions.timeoutMs ?? base.client.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
    try {
      let context = await createSseContext(
        {
          path,
          requestOptions: {
            ...requestOptions,
            signal: combineSignals([requestOptions.signal, timeout?.signal]),
          },
          client: base.client,
          interceptors,
        },
        attempt,
        undefined,
        {
          method: method ?? (requestOptions.body === undefined ? 'GET' : 'POST'),
          accept: 'application/x-ndjson',
        },
      )
      context.meta.transport = 'ndjson'
      context.meta.requestId = liveId
      const canRetry = attempt < context.meta.maxRetries
      const before = await runHook(interceptors, (item) => item.onRequest, context)
      if (before.type === 'short-circuit') {
        const result = before.result as FetchResult<unknown, FetchErrorInfo>
        return result.ok ? undefined : throwResult(result)
      }
      if (before.type === 'retry') {
        if (!canRetry) return retryExhausted()
        await wait(before.delayMs ?? 500, requestOptions.signal)
        continue
      }
      if (before.type === 'continue') context = before.context

      const { request } = context
      const body = encodeBody(request.body, request.headers)
      let response: Response
      try {
        response = await fetchImpl(request.url, {
          method: request.method,
          headers: request.headers,
          body,
          signal: request.signal,
          credentials: base.client.credentials,
          // Required by Node/undici when streaming a request body.
          ...(typeof ReadableStream !== 'undefined' && body instanceof ReadableStream
            ? { duplex: 'half' }
            : {}),
        } as RequestInit)
      } catch (error) {
        if (isAbortError(error)) throw error
        context.error = toFetchErrorInfo(0, {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        })
        const failed = await runHook(interceptors, (item) => item.onRequestError, context)
        if (failed.type === 'retry') {
          if (!canRetry) return retryExhausted()
          await wait(failed.delayMs ?? 500, requestOptions.signal)
          continue
        }
        if (failed.type === 'short-circuit') {
          const result = failed.result as FetchResult<unknown, FetchErrorInfo>
          return result.ok ? undefined : throwResult(result)
        }
        return throwResult(toErrResult(0, context.error, new Headers()))
      }
      context.response = response

      if (response.ok && response.body) {
        await runHook(interceptors, (item) => item.onResponse, context)
        await runHook(interceptors, (item) => item.onLiveOpen, context)
        return { response, context, interceptors }
      }

      context.data = parseLine(await response.text())
      context.error = toFetchErrorInfo(response.status, context.data)
      const after = await runHook(interceptors, (item) => item.onResponseError, context)
      if (after.type === 'retry') {
        if (!canRetry) return retryExhausted()
        await wait(after.delayMs ?? 0, requestOptions.signal)
        continue
      }
      if (after.type === 'short-circuit') {
        const result = after.result as FetchResult<unknown, FetchErrorInfo>
        return result.ok ? undefined : throwResult(result)
      }
      const error = after.type === 'continue' ? after.context.error : context.error
      return throwResult(toErrResult(response.status, error ?? context.error, response.headers))
    } finally {
      timeout?.clear()
    }
  }
}

// eslint-disable-next-line no-restricted-syntax -- generators need function syntax
async function* sendNdjson<T>(
  base: StreamBase,
  path: string,
  options: StreamCallOptions = {},
): AsyncGenerator<T> {
  const opened = await openResponse(base, path, options)
  const body = opened?.response.body
  if (!opened || !body) return
  const { context, interceptors } = opened

  const reader = body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let failure: unknown
  try {
    for (;;) {
      const chunk = await reader.read()
      const lines = (buffer + (chunk.value ?? '')).split('\n')
      buffer = chunk.done ? '' : (lines.pop() ?? '')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const data = parseLine(trimmed)
        const message: LiveMessageContext = { ...context, message: { direction: 'in', data } }
        await runHook(interceptors, (item) => item.onLiveMessage, message)
        yield data as T
      }
      if (chunk.done) return
    }
  } catch (error) {
    failure = error
    throw error
  } finally {
    // Early `break` from for-await lands here.
    await reader.cancel().catch(() => undefined)
    const error = failure
      ? toFetchErrorInfo(0, {
          code: 'STREAM_ERROR',
          message: failure instanceof Error ? failure.message : 'stream failed',
        })
      : undefined
    await runHook(interceptors, (item) => item.onLiveClose, error ? { ...context, error } : context)
  }
}

export { sendNdjson }
