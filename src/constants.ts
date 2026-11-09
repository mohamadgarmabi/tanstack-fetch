const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_RETRIES = 2
const DEFAULT_INTERCEPTOR_ORDER = 100
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const RETRY_STATUSES = new Set([502, 503, 504])
/** Set on responses answered by `mocks`; the value is the matched route path. */
const MOCK_HEADER = 'x-tanstack-fetch-mock'

export {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_INTERCEPTOR_ORDER,
  IDEMPOTENT_METHODS,
  RETRY_STATUSES,
  MOCK_HEADER,
}
