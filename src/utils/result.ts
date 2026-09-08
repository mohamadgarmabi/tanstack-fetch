import { createFetchError } from '../fetch-error'
import type { FetchErrorInfo, FetchResult } from '../types'

const toFetchErrorInfo = (status: number, body: unknown): FetchErrorInfo => {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined
  const code = typeof record?.code === 'string' ? record.code : 'HTTP_ERROR'
  const message =
    typeof record?.message === 'string' ? record.message : `Request failed with status ${status}`

  return { status, code, message, body }
}

const toOkResult = <T>(status: number, data: T, headers: Headers): FetchResult<T, never> => ({
  ok: true,
  status,
  data,
  headers,
})

const toErrResult = <E>(status: number, error: E, headers: Headers): FetchResult<never, E> => ({
  ok: false,
  status,
  error,
  headers,
})

const unwrap = <T>(result: FetchResult<T, FetchErrorInfo>): T => {
  if (result.ok) {
    return result.data
  }
  throw createFetchError(result)
}

const unwrapAsync = async <T>(promise: Promise<FetchResult<T, FetchErrorInfo>>): Promise<T> =>
  unwrap(await promise)

/** @deprecated Use toFetchErrorInfo */
const toHttpError = toFetchErrorInfo

export { toFetchErrorInfo, toHttpError, toOkResult, toErrResult, unwrap, unwrapAsync }
