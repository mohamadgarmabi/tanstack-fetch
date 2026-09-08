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

type HttpResult<T, E = HttpError> = OkResult<T> | ErrResult<E>

type HttpError = {
  status: number
  code: string
  message: string
  body: unknown
}

export type { OkResult, ErrResult, HttpResult, HttpError }
