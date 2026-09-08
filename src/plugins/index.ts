import type { HttpInterceptor, PluginName } from '../types'
import { createRetryIdempotentInterceptor } from './retry-idempotent'
import { createSseResumeInterceptor } from './sse-resume'
import { createSsrForwardInterceptor } from './ssr-forward'
import { createTraceInterceptor } from './trace'

const pluginFactories: Record<PluginName, () => HttpInterceptor> = {
  trace: createTraceInterceptor,
  'ssr-forward': createSsrForwardInterceptor,
  'retry-idempotent': createRetryIdempotentInterceptor,
  'sse-resume': createSseResumeInterceptor,
}

export {
  pluginFactories,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
}
