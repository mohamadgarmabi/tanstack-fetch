import type { AuthConfig, HttpInterceptor, StatusHandlers } from '../types'
import type { RefreshTokenConfig } from '../types/refresh-token.type'
import { createAuthInterceptor } from './auth'
import { createRefreshTokenInterceptor } from './refresh-token'
import { createRetryIdempotentInterceptor } from './retry-idempotent'
import { createSseResumeInterceptor } from './sse-resume'
import { createSsrForwardInterceptor } from './ssr-forward'
import { createStatusInterceptor } from './status'
import { createTraceInterceptor } from './trace'
import type { PluginName } from '../types'

const pluginFactories: Record<PluginName, () => HttpInterceptor> = {
  trace: createTraceInterceptor,
  'ssr-forward': createSsrForwardInterceptor,
  'retry-idempotent': createRetryIdempotentInterceptor,
  'sse-resume': createSseResumeInterceptor,
}

export {
  pluginFactories,
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createStatusInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
}
export type { AuthConfig, RefreshTokenConfig, StatusHandlers }
