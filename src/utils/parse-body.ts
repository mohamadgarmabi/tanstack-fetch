const isJsonContentType = (contentType: string | null) =>
  Boolean(contentType && contentType.includes('json'))

type BodyParseError = Error & {
  readonly name: 'BodyParseError'
  readonly status: number
  readonly bodyText: string
  readonly headers: Headers
}

const createBodyParseError = (
  message: string,
  status: number,
  bodyText: string,
  headers: Headers,
): BodyParseError => {
  const error = new Error(message) as BodyParseError
  error.name = 'BodyParseError'
  Object.assign(error, { status, bodyText, headers })
  return error
}

const isBodyParseError = (error: unknown): error is BodyParseError =>
  Boolean(
    error &&
    typeof error === 'object' &&
    (error as Error).name === 'BodyParseError' &&
    'status' in error &&
    'bodyText' in error,
  )

const parseBody = async (response: Response, parseAs?: 'json' | 'text' | 'blob') => {
  if (response.status === 204) {
    return null
  }

  if (parseAs === 'blob') {
    return response.blob()
  }

  if (parseAs === 'text') {
    return response.text()
  }

  const contentType = response.headers.get('content-type')
  if (parseAs === 'json' || isJsonContentType(contentType)) {
    const text = await response.text()
    if (!text) {
      return null
    }
    try {
      return JSON.parse(text) as unknown
    } catch {
      throw createBodyParseError(
        'Failed to parse JSON response',
        response.status,
        text,
        response.headers,
      )
    }
  }

  return response.text()
}

const encodeBody = (body: unknown, headers: Headers) => {
  if (body === undefined || body === null) {
    return undefined
  }
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  ) {
    return body
  }
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return JSON.stringify(body)
}

export { parseBody, encodeBody, isJsonContentType, isBodyParseError }
export type { BodyParseError }
