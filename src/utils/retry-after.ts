/**
 * Parse `Retry-After` (seconds or HTTP-date) into a delay in milliseconds.
 * Returns `undefined` when the header is missing or invalid.
 */
const parseRetryAfter = (headers: Headers | undefined, fallbackMs?: number): number | undefined => {
  if (!headers) {
    return fallbackMs
  }

  const raw = headers.get('retry-after')
  if (!raw) {
    return fallbackMs
  }

  const asSeconds = Number(raw)
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.round(asSeconds * 1000)
  }

  const asDate = Date.parse(raw)
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - Date.now())
  }

  return fallbackMs
}

export { parseRetryAfter }
