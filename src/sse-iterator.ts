import type { FetchResult, SseEvent } from './types'
import { resolveInterceptors, runHook } from './interceptors/run-interceptors'
import { consumeSseBuffer } from './sse-parse'
import { wait } from './utils/signals'
import { toErrResult, toFetchErrorInfo } from './utils/result'
import { createFetchError } from './fetch-error'
import { createSseContext, type SendSseArgs } from './sse-context'

const createSseIterator = <T>(args: SendSseArgs): AsyncIterator<SseEvent<T>> => {
  const interceptors = resolveInterceptors(args.interceptors, args.requestOptions?.interceptors)
  const fetchImpl = args.client.fetch ?? globalThis.fetch
  const queue: SseEvent<T>[] = []
  let reader: ReadableStreamDefaultReader<string> | undefined
  let buffer = ''
  let lastEventId = args.requestOptions?.headers
    ? (new Headers(args.requestOptions.headers).get('last-event-id') ?? undefined)
    : undefined
  let attempt = 0
  let closed = false

  const pull = async (): Promise<IteratorResult<SseEvent<T>>> => {
    if (queue.length > 0) {
      return { value: queue.shift() as SseEvent<T>, done: false }
    }
    if (closed) {
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

  const openStream = async (): Promise<boolean> => {
    if (!fetchImpl) {
      throw new Error('tanstack-fetch: fetch is not available')
    }
    let context = await createSseContext(args, attempt, lastEventId)
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
        await wait(before.delayMs ?? 500)
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
    const response = await fetchImpl(context.request.url, {
      method: 'GET',
      headers: context.request.headers,
      signal: context.request.signal,
      credentials: args.client.credentials,
    })
    context.response = response
    if (!response.ok || !response.body) {
      context.error = toFetchErrorInfo(response.status, await response.text())
      const failed = await runHook(interceptors, (item) => item.onSseError, context)
      if (failed.type === 'retry' && attempt < context.meta.maxRetries) {
        attempt += 1
        await wait(failed.delayMs ?? 500)
        const reconnect = await runHook(interceptors, (item) => item.onSseReconnect, context)
        if (reconnect.type === 'continue') {
          lastEventId = reconnect.context.meta.lastEventId ?? lastEventId
        }
        return openStream()
      }
      throw createFetchError(toErrResult(response.status, context.error, response.headers))
    }
    await runHook(interceptors, (item) => item.onSseOpen, context)
    reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    return true
  }

  const readNext = async (): Promise<IteratorResult<SseEvent<T>>> => {
    const currentReader = reader
    if (!currentReader) {
      closed = true
      return { value: undefined, done: true }
    }
    const chunk = await currentReader.read()
    if (chunk.done) {
      reader = undefined
      closed = true
      return pull()
    }
    const parsed = consumeSseBuffer(buffer + chunk.value)
    buffer = parsed.rest
    for (const event of parsed.events) {
      lastEventId = event.id ?? lastEventId
      const context = await createSseContext(args, attempt, lastEventId)
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

  return { next: pull }
}

export { createSseIterator }
