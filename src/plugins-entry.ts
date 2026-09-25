import {
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createStatusInterceptor,
  createTraceInterceptor,
  pluginFactories,
} from './plugins'
import type { HttpInterceptor, PluginName, RefreshTokenConfig } from './types'

const resolvePlugins = (names: PluginName[]): HttpInterceptor[] =>
  names.map((name) => pluginFactories[name]())

export {
  resolvePlugins,
  pluginFactories,
  createAuthInterceptor,
  createRefreshTokenInterceptor,
  createStatusInterceptor,
  createRetryIdempotentInterceptor,
  createSseResumeInterceptor,
  createSsrForwardInterceptor,
  createTraceInterceptor,
}
export type { PluginName, HttpInterceptor, RefreshTokenConfig }
