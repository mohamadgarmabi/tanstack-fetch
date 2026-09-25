import type { MaybePromise } from './common.type'

type RefreshTokenBeforeConfig = {
  /** Epoch ms when the current access token expires. */
  getExpiresAt: () => MaybePromise<number | null | undefined>
  /** Refresh this many ms before expiry. Default: `60_000`. */
  skewMs?: number
}

type RefreshTokenAfterConfig = {
  /** Refresh on the first 401, then retry. Default: `true`. */
  enabled?: boolean
}

type RefreshTokenConfig = {
  /**
   * Refresh the access token.
   * Update whatever `getToken` / `auth.getToken` reads (and `getExpiresAt` if you use `before`).
   */
  refresh: () => MaybePromise<void>
  /**
   * Before the request: refresh when the token is near expiry (time-based).
   * Runs ahead of the auth interceptor so the new token is attached.
   */
  before?: RefreshTokenBeforeConfig
  /**
   * After the first 401: refresh once (single-flight), then `{ action: 'retry' }`.
   * Pass `false` to disable. Default: enabled.
   */
  after?: RefreshTokenAfterConfig | false
  /** Called when `refresh` throws. The request then continues (or fails) normally. */
  onRefreshFailed?: (error: unknown) => MaybePromise<void>
}

export type { RefreshTokenBeforeConfig, RefreshTokenAfterConfig, RefreshTokenConfig }
