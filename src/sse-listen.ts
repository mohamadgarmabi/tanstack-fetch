import { isAbortError } from './fetch-error'
import { sendSse } from './sse-stream'
import { combineSignals } from './utils/signals'
import type { SendSseArgs } from './sse-context'
import type { RequestOptions, SseEvent, SseHandlers, SseSubscription } from './types'

type SseCallOptions<T> = RequestOptions &
  SseHandlers<T> & {
    lastEventId?: string
  }

const HANDLER_KEYS = [
  'onMessage',
  'onEvent',
  'onOpen',
  'onError',
  'onClose',
  'lastEventId',
] as const

const splitSseOptions = <T>(options?: SseCallOptions<T>) => {
  const handlers: SseHandlers<T> = {}
  const requestOptions: RequestOptions = { ...(options ?? {}) }
  const lastEventId = options?.lastEventId

  for (const key of HANDLER_KEYS) {
    if (key === 'lastEventId') {
      delete (requestOptions as Record<string, unknown>).lastEventId
      continue
    }
    if (options && key in options) {
      ;(handlers as Record<string, unknown>)[key] = options[key]
      delete (requestOptions as Record<string, unknown>)[key]
    }
  }

  if (lastEventId) {
    const headers = new Headers(requestOptions.headers)
    headers.set('last-event-id', lastEventId)
    requestOptions.headers = headers
  }

  return { handlers, requestOptions, lastEventId }
}

const hasSseHandlers = <T>(options?: SseCallOptions<T>) =>
  Boolean(
    options &&
    (options.onMessage || options.onEvent || options.onOpen || options.onError || options.onClose),
  )

const listenSse = <T>(args: SendSseArgs, handlers: SseHandlers<T>): SseSubscription => {
  const controller = new AbortController()
  const signal = combineSignals([args.requestOptions?.signal, controller.signal])

  const run = async () => {
    try {
      handlers.onOpen?.()
      for await (const event of sendSse<T>({
        ...args,
        requestOptions: { ...args.requestOptions, signal },
      })) {
        handlers.onEvent?.(event)
        handlers.onMessage?.(event.data, event)
      }
      handlers.onClose?.()
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) {
        handlers.onClose?.()
        return
      }
      handlers.onError?.(error)
    }
  }

  void run()

  return {
    close: () => controller.abort(),
  }
}

const createSseApi = (base: Omit<SendSseArgs, 'path' | 'requestOptions'>) => {
  const sse = (<T>(path: string, options?: SseCallOptions<T>) => {
    const { handlers, requestOptions } = splitSseOptions(options)
    const args: SendSseArgs = {
      path,
      requestOptions,
      client: base.client,
      interceptors: base.interceptors,
    }

    if (hasSseHandlers(options)) {
      return listenSse<T>(args, handlers)
    }

    return sendSse<T>(args)
  }) as {
    <T>(
      path: string,
      options: SseCallOptions<T> &
        ({ onMessage: SseHandlers<T>['onMessage'] } | { onEvent: SseHandlers<T>['onEvent'] }),
    ): SseSubscription
    <T>(path: string, options?: SseCallOptions<T>): AsyncIterable<SseEvent<T>>
  }

  return sse
}

export { listenSse, splitSseOptions, hasSseHandlers, createSseApi }
export type { SseCallOptions }
