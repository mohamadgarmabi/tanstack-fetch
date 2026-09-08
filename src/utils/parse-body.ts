const isJsonContentType = (contentType: string | null) =>
  Boolean(contentType && contentType.includes('json'))

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
    return JSON.parse(text) as unknown
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

export { parseBody, encodeBody, isJsonContentType }
