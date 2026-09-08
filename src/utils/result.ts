import type { HttpError, HttpResult } from '../types'

const toHttpError = (status: number, body: unknown): HttpError => {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined
  const code = typeof record?.code === 'string' ? record.code : 'HTTP_ERROR'
  const message =
    typeof record?.message === 'string' ? record.message : `Request failed with status ${status}`

  return { status, code, message, body }
}

const toOkResult = <T>(status: number, data: T, headers: Headers): HttpResult<T, never> => ({
  ok: true,
  status,
  data,
  headers,
})

const toErrResult = <E>(status: number, error: E, headers: Headers): HttpResult<never, E> => ({
  ok: false,
  status,
  error,
  headers,
})

export { toHttpError, toOkResult, toErrResult }
