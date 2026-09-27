const parseQuery = (url: URL): Record<string, string> => {
  const query: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    query[key] = value
  })
  return query
}

/**
 * Best-effort path params from trailing segments that look like ids
 * (uuid / numeric / short token). Real `:id` map is not on RequestContext.
 */
const parsePathParams = (pathname: string): Record<string, string> => {
  const params: Record<string, string> = {}
  const parts = pathname.split('/').filter(Boolean)
  parts.forEach((part, index) => {
    const looksLikeId =
      /^\d+$/.test(part) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(part) ||
      (/^[A-Za-z0-9_-]{6,}$/.test(part) && !/^[a-z]+$/.test(part))
    if (looksLikeId) {
      const key = parts[index - 1] ? `${parts[index - 1]}Id` : `param${index}`
      params[key] = part
    }
  })
  return params
}

const headersToRecord = (headers: Headers, redact: Set<string>): Record<string, string> => {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = redact.has(key.toLowerCase()) ? '***' : value
  })
  return out
}

export { parseQuery, parsePathParams, headersToRecord }
