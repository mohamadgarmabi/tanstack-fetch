import { describe, expect, it } from 'vitest'
import { buildUrl } from '../src/utils/build-url'

describe('buildUrl', () => {
  it('fills path params and skips empty query values', () => {
    const url = buildUrl(
      'https://api.example.com',
      '/users/:id',
      { id: 'ada' },
      { page: 2, empty: undefined },
    )
    expect(url.toString()).toBe('https://api.example.com/users/ada?page=2')
  })

  it('accepts OpenAPI brace params', () => {
    const url = buildUrl('https://api.example.com', '/users/{id}', { id: '1' })
    expect(url.pathname).toBe('/users/1')
  })

  it('does not treat a port in an absolute path as a param', () => {
    const url = buildUrl(undefined, 'http://localhost:8080/users/:id', { id: '1' })
    expect(url.toString()).toBe('http://localhost:8080/users/1')
  })

  it('ignores colons in the query string and hash', () => {
    const url = buildUrl('https://api.example.com', '/search/:id?t=10:30#a:b', { id: '7' })
    expect(url.toString()).toBe('https://api.example.com/search/7?t=10:30#a:b')
  })

  it('keeps a colon inside a segment literal', () => {
    const url = buildUrl('https://x.test', '/v1/models/gemini:generateContent')
    expect(url.pathname).toBe('/v1/models/gemini:generateContent')
  })

  it('repeats array query values', () => {
    const url = buildUrl('https://x.test', '/a', undefined, { ids: [1, 2], q: 'x' })
    expect(url.search).toBe('?ids=1&ids=2&q=x')
  })
})
