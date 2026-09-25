import type { HttpInterceptor } from '../types'
import type { RefreshTokenConfig } from '../types/refresh-token.type'

const DEFAULT_SKEW_MS = 60_000

const createRefreshTokenInterceptor = (config: RefreshTokenConfig): HttpInterceptor => {
  let refreshPromise: Promise<void> | null = null

  const runRefresh = async () => {
    if (!refreshPromise) {
      refreshPromise = Promise.resolve()
        .then(() => config.refresh())
        .finally(() => {
          refreshPromise = null
        })
    }
    return refreshPromise
  }

  const shouldRefreshBefore = async () => {
    if (!config.before) {
      return false
    }
    const expiresAt = await config.before.getExpiresAt()
    if (expiresAt == null) {
      return false
    }
    const skewMs = config.before.skewMs ?? DEFAULT_SKEW_MS
    return Date.now() >= expiresAt - skewMs
  }

  const afterEnabled = config.after !== false && config.after?.enabled !== false

  return {
    name: 'refresh-token',
    order: 10,
    onRequest: async (context) => {
      if (!(await shouldRefreshBefore())) {
        return { action: 'continue', context }
      }
      try {
        await runRefresh()
      } catch (error) {
        await config.onRefreshFailed?.(error)
      }
      return { action: 'continue', context }
    },
    onResponseError: async (context) => {
      if (!afterEnabled || context.error?.status !== 401 || context.meta.attempt > 0) {
        return { action: 'continue', context }
      }
      try {
        await runRefresh()
        return { action: 'retry' }
      } catch (error) {
        await config.onRefreshFailed?.(error)
        return { action: 'continue', context }
      }
    },
  }
}

export { createRefreshTokenInterceptor }
