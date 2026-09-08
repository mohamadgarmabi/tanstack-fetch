import type { HttpInterceptor, StatusHandler, StatusHandlers } from '../types'

const resolveStatusHandler = (
  status: number,
  handlers: StatusHandlers,
): StatusHandler | undefined => {
  const exact = handlers[status]
  if (exact) {
    return exact
  }
  if (status >= 500 && status < 600 && handlers['5xx']) {
    return handlers['5xx']
  }
  if (status >= 400 && status < 500 && handlers['4xx']) {
    return handlers['4xx']
  }
  return handlers.default
}

const createStatusInterceptor = (handlers: StatusHandlers): HttpInterceptor => ({
  name: 'on-status',
  order: 95,
  onResponseError: async (context) => {
    const status = context.error?.status ?? context.response?.status
    if (status === undefined || !context.error) {
      return { action: 'continue', context }
    }
    const handler = resolveStatusHandler(status, handlers)
    if (!handler) {
      return { action: 'continue', context }
    }
    const decision = await handler({ status, error: context.error, context })
    if (decision?.action === 'retry') {
      return { action: 'retry', delayMs: decision.delayMs }
    }
    return { action: 'continue', context }
  },
})

export { createStatusInterceptor, resolveStatusHandler }
