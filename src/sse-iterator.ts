import type { FetchErrorInfo, FetchResult, RequestContext, SseEvent } from './types'
import { resolveInterceptors, runHook } from './interceptors/run-interceptors'
import { consumeSseBuffer } from './sse-parse'
import { wait } from './utils/signals'
import { encodeBody } from './utils/parse-body'
import { toErrResult, toFetchErrorInfo } from './utils/result'
import { createFetchError, isAbortError } from './fetch-error'
import { createSseContext, type SendSseArgs } from './sse-context'

const networkError = (error: unknown) =>
  toFetchErrorInfo(0, {
    code: 'NETWORK_ERROR',
    message: error instanceof Error ? error.message : 'Network error',
  })

const createSseIterator = <T>(args: SendSseArgs): AsyncIterator<SseEvent<T>> => {
  const interceptors = resolveInterceptors(args.interceptors, args.requestOptions?.interceptors)
  const fetchImpl = args.client.fetch ?? globalThis.fetch
  const signal = args.requestOptions?.signal
  const queue: SseEvent<T>[] = []
  let reader: ReadableStreamDefaultReader<string> | undefined
  let buffer = ''
  let lastEventId = args.requestOptions?.headers
    ? (new Headers(args.requestOptions.headers).get('last-event-id') ?? undefined)
    : undefined
  let attempt = 0
  let closed = false
  let openContext: RequestContext | undefined
  let closeNotified = false
  // Headers added / changed by onSseReconnect, applied to the next connection.
  let reconnectHeaders: Headers | undefined

  const notifyClose = async () => {
    if (closeNotified || !openContext) return
    closeNotified = true
    await runHook(interceptors, (item) => item.onSseClose, openContext)
  }

  const pull = async (): Promise<IteratorResult<SseEvent<T>>> => {
    if (queue.length > 0) {
      return { value: queue.shift() as SseEvent<T>, done: false }
    }
    if (closed) {
      await notifyClose()
      return { value: undefined, done: true }
    }
    if (!reader) {
      const started = await openStream()
      if (!started) {
        closed = true
        return { value: undefined, done: true }
      }
    }
    return readNext()
  }

  /** onSseError → (retry) wait → onSseReconnect → openStream; throws `failure` when not retried. */
  const reconnect = async (
    context: RequestContext,
    error: FetchErrorInfo,
    failure: unknown,
  ): Promise<boolean> => {
    context.error = error
    context.meta.lastEventId = lastEventId
    const failed = await runHook(interceptors, (item) => item.onSseError, context)
    if (failed.type !== 'retry' || attempt >= context.meta.maxRetries) throw failure
    attempt += 1
    await wait(failed.delayMs ?? 500, signal)
    const before = new Headers(context.request.headers)
    const next = await runHook(interceptors, (item) => item.onSseReconnect, context)
    if (next.type === 'continue') {
      lastEventId = next.context.meta.lastEventId ?? lastEventId
      next.context.request.headers.forEach((value, key) => {
        if (before.get(key) !== value) (reconnectHeaders ??= new Headers()).set(key, value)
      })
    }
    return openStream()
  }

  const openStream = async (): Promise<boolean> => {
    if (!fetchImpl) {
      throw new Error('tanstack-fetch: fetch is not available')
    }
    let context = await createSseContext(
      args,
      attempt,
      lastEventId,
      // Like api.stream: a body implies POST (fetch rejects a GET with a body).
      { method: args.requestOptions?.body === undefined ? 'GET' : 'POST' },
    )
    reconnectHeaders?.forEach((value, key) => context.request.headers.set(key, value))
    const before = await runHook(interceptors, (item) => item.onRequest, context)
    if (before.type === 'short-circuit') {
      const result = before.result as FetchResult<unknown, unknown>
      if (!result.ok) {
        throw createFetchError(result as FetchResult<never, ReturnType<typeof toFetchErrorInfo>>)
      }
      return false
    }
    if (before.type === 'retry') {
      if (attempt < context.meta.maxRetries) {
        attempt += 1
        await wait(before.delayMs ?? 500, signal)
        return openStream()
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
    if (before.type === 'continue') {
      context = before.context
    }
    const { request } = context
    const body = encodeBody(request.body, request.headers)
    let response: Response
    try {
      response = await fetchImpl(request.url, {
        method: request.method,
        headers: request.headers,
        body,
        signal: request.signal,
        credentials: args.client.credentials,
        // Required by Node/undici when streaming a request body.
        ...(typeof ReadableStream !== 'undefined' && body instanceof ReadableStream
          ? { duplex: 'half' }
          : {}),
      } as RequestInit)
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) throw error
      return reconnect(context, networkError(error), error)
    }
    context.response = response
    if (!response.ok || !response.body) {
      const info = toFetchErrorInfo(response.status, await response.text())
      return reconnect(
        context,
        info,
        createFetchError(toErrResult(response.status, info, response.headers)),
      )
    }
    openContext = context
    await runHook(interceptors, (item) => item.onSseOpen, context)
    args.onStreamOpen?.()
    reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    return true
  }

  const readNext = async (): Promise<IteratorResult<SseEvent<T>>> => {
    const currentReader = reader
    if (!currentReader) {
      closed = true
      await notifyClose()
      return { value: undefined, done: true }
    }
    let chunk: ReadableStreamReadResult<string>
    try {
      chunk = await currentReader.read()
    } catch (error) {
      if (isAbortError(error) || signal?.aborted || !openContext) throw error
      // Dropped mid-stream: same retry path as a failed open, starting from a clean parser state.
      reader = undefined
      buffer = ''
      if (!(await reconnect(openContext, networkError(error), error))) closed = true
      return pull()
    }
    if (chunk.done) {
      reader = undefined
      closed = true
      await notifyClose()
      return pull()
    }
    const parsed = consumeSseBuffer(buffer + chunk.value)
    buffer = parsed.rest
    for (const { id, event } of parsed.blocks) {
      lastEventId = id ?? lastEventId
      if (!event) continue
      // The stream is making progress again: give later drops a fresh retry budget.
      attempt = 0
      const context = await createSseContext(args, attempt, lastEventId)
      // Preserve requestId from the open context so DevTools / hooks can correlate.
      if (openContext?.meta.requestId) {
        context.meta.requestId = openContext.meta.requestId
      }
      const after = await runHook(interceptors, (item) => item.onSseEvent, { ...context, event })
      if (after.type === 'drop') {
        continue
      }
      if (after.type === 'continue' && after.context.event) {
        queue.push(after.context.event as SseEvent<T>)
      }
    }
    return pull()
  }

  const stop = async () => {
    closed = true
    try {
      await reader?.cancel()
    } catch {
      // ignore
    }
    reader = undefined
    await notifyClose()
  }

  return {
    next: async () => {
      try {
        return await pull()
      } catch (error) {
        // for-await does not call return() when next() throws: close here so onSseClose still runs.
        await stop()
        throw error
      }
    },
    return: async () => {
      await stop()
      return { value: undefined, done: true }
    },
  }
}

export { createSseIterator }
