import { IDEMPOTENT_METHODS, RETRY_STATUSES } from '../constants'
import type { HttpInterceptor } from '../types'

const createRetryIdempotentInterceptor = (): HttpInterceptor => ({
  name: 'retry-idempotent',
  order: 80,
  onResponseError: (context) => {
    const canRetry =
      IDEMPOTENT_METHODS.has(context.request.method) &&
      context.meta.attempt < context.meta.maxRetries &&
      Boolean(context.error && RETRY_STATUSES.has(context.error.status))
    if (!canRetry) {
      return { action: 'continue', context }
    }
    return { action: 'retry', delayMs: 200 * (context.meta.attempt + 1) }
  },
})

export { createRetryIdempotentInterceptor }
