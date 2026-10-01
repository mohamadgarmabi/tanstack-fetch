import { describe, expectTypeOf, it } from 'vitest'
import { createFetch, pathParams } from '../src'
import type { ExtractPathParamKeys, PathParamsOf } from '../src'
import { createFetch as createSseFetch } from '../src/sse'

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
    type PostDto = { id: number; title: string; body: string; userId?: number }

    // Compile-only checks — never invoke (would hit the network)
    const typeCheck = async () => {
      void api.get('/users')
      void api.get('/users/:id', { params: { id: '1' } })
      void api.get('/users/{id}', { params: pathParams('/users/{id}', { id: 2 }) })
      void api.get('/users/:id/posts/:postId', {
        params: { id: '1', postId: '2' },
      })

      const unknownUser = await api.get('/users/:id', { params: { id: '1' } })
      expectTypeOf(unknownUser).toBeUnknown()

      const user = await api.get<PostDto>()('/users/:id', { params: { id: 1 } })
      expectTypeOf(user).toEqualTypeOf<PostDto>()

      const post = await api.get<PostDto>()('new/old/:id', { params: { id: 1 } })
      expectTypeOf(post).toEqualTypeOf<PostDto>()

      // @ts-expect-error missing params for patterned path
      void api.get('/users/:id')

      // @ts-expect-error wrong param key
      void api.get('/users/:id', { params: { userId: '1' } })

      // @ts-expect-error empty params without generic
      void api.get('new/old/:id', { params: {} })

      // @ts-expect-error empty params with response generic (curry form)
      void api.get<PostDto>()('new/old/:id', { params: {} })

      // @ts-expect-error missing params with response generic
      void api.get<PostDto>()('new/old/:id')
    }

    expectTypeOf(typeCheck).toBeFunction()
  })

  it('keeps sse client assignable', () => {
    const full = createSseFetch()
    expectTypeOf(full.get).toBeFunction()
    expectTypeOf(full.sse).toBeFunction()
  })
})
