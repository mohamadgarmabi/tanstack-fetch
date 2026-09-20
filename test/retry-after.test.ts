import { describe, expect, it } from 'vitest'
import { parseRetryAfter } from '../src'

describe('parseRetryAfter', () => {
  it('parses delay-seconds', () => {
    const headers = new Headers({ 'retry-after': '3' })
    expect(parseRetryAfter(headers)).toBe(3000)
  })

  it('returns fallback when missing', () => {
    expect(parseRetryAfter(new Headers(), 1500)).toBe(1500)
    expect(parseRetryAfter(undefined, 900)).toBe(900)
  })

  it('parses HTTP-date', () => {
    const when = new Date(Date.now() + 5000).toUTCString()
    const headers = new Headers({ 'retry-after': when })
    const delay = parseRetryAfter(headers)
    expect(delay).toBeGreaterThan(1000)
    expect(delay).toBeLessThanOrEqual(6000)
  })
})
