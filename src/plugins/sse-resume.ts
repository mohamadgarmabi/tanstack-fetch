import type { HttpInterceptor } from '../types'

const createSseResumeInterceptor = (): HttpInterceptor => ({
  name: 'sse-resume',
  order: 20,
  onSseEvent: (context) => {
    if (context.event.event === 'ping' || context.event.event === 'heartbeat') {
      return { action: 'drop' }
    }
    return { action: 'continue', context }
  },
  onSseReconnect: (context) => {
    if (context.meta.lastEventId) {
      context.request.headers.set('last-event-id', context.meta.lastEventId)
    }
    return { action: 'continue', context }
  },
})

export { createSseResumeInterceptor }
