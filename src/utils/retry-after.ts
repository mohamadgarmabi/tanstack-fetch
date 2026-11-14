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

  if (/^\s*-?\d+(\.\d+)?\s*$/.test(raw)) {
    const asSeconds = Number(raw)
    return asSeconds >= 0 ? Math.round(asSeconds * 1000) : fallbackMs
  }

  // HTTP-dates start with a weekday; Date.parse alone accepts junk like `soon 5`.
  const asDate = /^\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,? /i.test(raw)
    ? Date.parse(raw)
    : Number.NaN
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - Date.now())
  }

  return fallbackMs
}

export { parseRetryAfter }
