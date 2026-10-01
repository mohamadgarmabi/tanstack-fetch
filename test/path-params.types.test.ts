import { describe, expectTypeOf, it } from 'vitest'
import { createFetch, pathParams } from '../src'
import type { ExtractPathParamKeys, NoParams, PathParamsOf } from '../src'
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
    type UserType = { id: number; name: string }
    type Params = { id: number }

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

      // <Data, Params> — response + params map; path must contain :id / {id}
      const user = await api.get<UserType, Params>('/users/:id', { params: { id: 1 } })
      expectTypeOf(user).toEqualTypeOf<UserType>()

      const post = await api.get<UserType, Params>('new/old/:id', { params: { id: 1 } })
      expectTypeOf(post).toEqualTypeOf<UserType>()

      // <Data> only — options argument required (path literal is lost by TS)
      const list = await api.get<UserType[]>('/users', {})
      expectTypeOf(list).toEqualTypeOf<UserType[]>()

      // @ts-expect-error missing params for patterned path (no generics)
      void api.get('/users/:id')

      // @ts-expect-error wrong param key
      void api.get('/users/:id', { params: { userId: '1' } })

      // @ts-expect-error empty params without generic
      void api.get('new/old/:id', { params: {} })

      // @ts-expect-error <Data> only without params argument
      void api.get<UserType>('/new/user/:id')

      // @ts-expect-error <Data, Params> without options
      void api.get<UserType, Params>('/new/user/:id')

      // @ts-expect-error <Data, Params> missing id in params object
      void api.get<UserType, Params>('/new/user/:id', { params: {} })

      // @ts-expect-error path missing :id / {id} for Params keys
      void api.get<UserType, Params>('/users', { params: { id: 1 } })

      // @ts-expect-error Params key does not appear in path
      void api.get<UserType, { userId: number }>('/users/:id', { params: { userId: 1 } })
    }

    expectTypeOf(typeCheck).toBeFunction()
  })

  it('types post body when Body generic is set', () => {
    const api = createFetch({ baseUrl: 'https://api.example.com' })
    type UserType = { id: number; name: string }
    type CreateUser = { name: string }
    type Params = { id: number }

    const typeCheck = async () => {
      const created = await api.post<UserType, NoParams, CreateUser>('/users', {
        body: { name: 'Ada' },
      })
      expectTypeOf(created).toEqualTypeOf<UserType>()

      const updated = await api.put<UserType, Params, CreateUser>('/users/:id', {
        params: { id: 1 },
        body: { name: 'Ada' },
      })
      expectTypeOf(updated).toEqualTypeOf<UserType>()

      // @ts-expect-error missing body when Body generic is set
      void api.post<UserType, NoParams, CreateUser>('/users', {})

      // @ts-expect-error wrong body shape
      void api.post<UserType, NoParams, CreateUser>('/users', { body: { title: 'x' } })

      // @ts-expect-error missing body field
      void api.post<UserType, Params, CreateUser>('/users/:id', {
        params: { id: 1 },
      })
    }

    expectTypeOf(typeCheck).toBeFunction()
  })

  it('keeps sse client assignable', () => {
    const full = createSseFetch()
    expectTypeOf(full.get).toBeFunction()
    expectTypeOf(full.sse).toBeFunction()
  })
})
