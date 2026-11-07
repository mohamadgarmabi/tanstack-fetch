import type { HttpInterceptor } from '../types'
import type { RefreshTokenConfig } from '../types/refresh-token.type'

const DEFAULT_SKEW_MS = 60_000

const createRefreshTokenInterceptor = (config: RefreshTokenConfig): HttpInterceptor => {
  let refreshPromise: Promise<void> | null = null
  // Bumped after each successful refresh; lets a late 401 see that its token is already stale.
  let generation = 0

  const runRefresh = async () => {
    if (!refreshPromise) {
      refreshPromise = Promise.resolve()
        .then(() => config.refresh())
        .then(() => {
          generation += 1
        })
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
      if (await shouldRefreshBefore()) {
        try {
          await runRefresh()
        } catch (error) {
          await config.onRefreshFailed?.(error)
        }
      }
      if (context.meta.state) {
        context.meta.state.refreshSentGeneration = generation
      }
      return { action: 'continue', context }
    },
    onResponseError: async (context) => {
      if (!afterEnabled || context.error?.status !== 401) {
        return { action: 'continue', context }
      }
      const state = context.meta.state
      // Without per-call state (e.g. SSE contexts) fall back to "first attempt only".
      const alreadyTried = state ? state.refreshAttempted === true : context.meta.attempt > 0
      if (alreadyTried) {
        return { action: 'continue', context }
      }
      if (state) {
        state.refreshAttempted = true
        const sentGeneration = state.refreshSentGeneration
        if (typeof sentGeneration === 'number' && sentGeneration < generation) {
          // Another request refreshed after this one was sent: just resend with the new token.
          return { action: 'retry' }
        }
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
