import type { FetchErrorInfo, FetchResult } from './types'

type FetchError = Error & {
  readonly name: 'FetchError'
  readonly status: number
  readonly code: string
  readonly body: unknown
  readonly headers: Headers
  readonly result: FetchResult<never, FetchErrorInfo>
}

const createFetchError = (result: FetchResult<never, FetchErrorInfo>): FetchError => {
  const info: FetchErrorInfo = result.ok
    ? {
        status: result.status,
        code: 'UNKNOWN',
        message: 'Request failed',
        body: result.data,
      }
    : result.error

  const error = new Error(info.message) as FetchError
  Object.defineProperties(error, {
    name: { value: 'FetchError' },
    status: { value: info.status },
    code: { value: info.code },
    body: { value: info.body },
    headers: { value: result.headers },
    result: {
      value: result.ok
        ? { ok: false, status: info.status, error: info, headers: result.headers }
        : result,
    },
  })
  return error
}

const isFetchError = (error: unknown): error is FetchError =>
  Boolean(
    error &&
    typeof error === 'object' &&
    (error as Error).name === 'FetchError' &&
    'status' in error &&
    'code' in error,
  )

const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === 'AbortError') ||
  (error instanceof Error && error.name === 'AbortError')

export { createFetchError, isFetchError, isAbortError }
export type { FetchError }
