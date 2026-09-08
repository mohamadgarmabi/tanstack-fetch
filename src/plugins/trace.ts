import type { HttpInterceptor } from '../types'

const createTraceInterceptor = (): HttpInterceptor => ({
  name: 'trace',
  order: 0,
  onRequest: (context) => {
    const requestId = context.incoming?.requestId ?? globalThis.crypto.randomUUID()
    context.request.headers.set('x-request-id', requestId)
    context.meta.requestId = requestId
    return { action: 'continue', context }
  },
})

export { createTraceInterceptor }
