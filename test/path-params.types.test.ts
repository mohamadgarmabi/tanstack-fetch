import { describe, expectTypeOf, it } from 'vitest'
import { createFetch, pathParams } from '../src'
import type { ExtractPathParamKeys, PathParamsOf } from '../src'

describe('path params types', () => {
  it('extracts colon and brace keys', () => {
    expectTypeOf<ExtractPathParamKeys<'/users/:id'>>().toEqualTypeOf<'id'>()
    expectTypeOf<ExtractPathParamKeys<'/users/{id}/posts/{postId}'>>().toEqualTypeOf<
      'id' | 'postId'
    >()
    expectTypeOf<ExtractPathParamKeys<'/users/:id/posts/:postId'>>().toEqualTypeOf<
      'id' | 'postId'
    >()
    expectTypeOf<PathParamsOf<'/users/:id'>>().toEqualTypeOf<{ id: string | number }>()
  })

  it('types createFetch params from the path pattern', () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })

    // Compile-only checks — never invoke (would hit the network)
    const typeCheck = () => {
      void api.get('/users')
      void api.get('/users/:id', { params: { id: '1' } })
      void api.get('/users/{id}', { params: pathParams('/users/{id}', { id: 2 }) })
      void api.get('/users/:id/posts/:postId', {
        params: { id: '1', postId: '2' },
      })
      void api.get<{ id: string }>('/users/:id', { params: { id: '1' } })

      // @ts-expect-error missing params for patterned path
      void api.get('/users/:id')

      // @ts-expect-error wrong param key
      void api.get('/users/:id', { params: { userId: '1' } })
    }

    expectTypeOf(typeCheck).toBeFunction()
  })
})
