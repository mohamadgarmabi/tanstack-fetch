import type { HttpInterceptor } from '../types'

const createSsrForwardInterceptor = (): HttpInterceptor => ({
  name: 'ssr-forward',
  order: 10,
  onRequest: (context) => {
    if (context.meta.source === 'browser') {
      return { action: 'skip' }
    }
    if (context.incoming?.cookie) {
      context.request.headers.set('cookie', context.incoming.cookie)
    }
    if (context.incoming?.authorization) {
      context.request.headers.set('authorization', context.incoming.authorization)
    }
    if (context.incoming?.requestId) {
      context.request.headers.set('x-request-id', context.incoming.requestId)
    }
    return { action: 'continue', context }
  },
})

export { createSsrForwardInterceptor }
