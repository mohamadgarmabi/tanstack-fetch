type OkResult<T> = {
  ok: true
  status: number
  data: T
  headers: Headers
}

type ErrResult<E> = {
  ok: false
  status: number
  error: E
  headers: Headers
}

type FetchResult<T, E = FetchErrorInfo> = OkResult<T> | ErrResult<E>

type FetchErrorInfo = {
  status: number
  code: string
  message: string
  body: unknown
}

/** @deprecated Use FetchResult */
type HttpResult<T, E = FetchErrorInfo> = FetchResult<T, E>

/** @deprecated Use FetchErrorInfo */
type HttpError = FetchErrorInfo

export type { OkResult, ErrResult, FetchResult, FetchErrorInfo, HttpResult, HttpError }
