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
})
