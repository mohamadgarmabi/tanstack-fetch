import { describe, expectTypeOf, it } from 'vitest'
import { createFetch, pathParams } from '../src'
import type { ExtractPathParamKeys, FetchClient, FetchResult, PathParamsOf } from '../src'
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

  it('infers response and params from a route map', () => {
    type User = { id: string; name: string }
    type Routes = {
      '/users': User[]
      '/users/:id': User
      'POST /users': { created: true }
    }
    const api = createFetch<Routes>({ baseUrl: 'https://api.example.com' })

    const typeCheck = async () => {
      expectTypeOf(await api.get('/users/:id', { params: { id: 1 } })).toEqualTypeOf<User>()
      expectTypeOf(await api.get('/users')).toEqualTypeOf<User[]>()
      expectTypeOf(await api.post('/users', { body: {} })).toEqualTypeOf<{ created: true }>()
      expectTypeOf(await api.put('/users')).toEqualTypeOf<User[]>()
      expectTypeOf(await api.get('/unknown')).toBeUnknown()
      expectTypeOf(
        await api.get('/users/:id', { params: { id: 1 }, throwOnError: false }),
      ).toEqualTypeOf<FetchResult<User>>()
      expectTypeOf(
        await api.request('GET', '/users/:id', { params: { id: 1 } }),
      ).toEqualTypeOf<User>()

      // explicit generic still wins
      expectTypeOf(
        await api.get<{ custom: 1 }>('/users/:id', { params: { id: 1 } }),
      ).toEqualTypeOf<{ custom: 1 }>()

      // @ts-expect-error missing params for patterned path
      void api.get('/users/:id')

      // @ts-expect-error wrong param key
      void api.get('/users/:id', { params: { userId: '1' } })
    }

    expectTypeOf(typeCheck).toBeFunction()
  })

  it('accepts an interface as the route map', () => {
    interface Routes {
      'GET /users/:id': { id: string }
    }
    const api = createFetch<Routes>()
    const typeCheck = async () => {
      expectTypeOf(await api.get('/users/:id', { params: { id: 1 } })).toEqualTypeOf<{
        id: string
      }>()
      expectTypeOf(await api.post('/users/:id', { params: { id: 1 } })).toBeUnknown()
    }
    expectTypeOf(typeCheck).toBeFunction()
  })

  it('keeps typed clients assignable to the default client type', () => {
    type Routes = { '/users/:id': { id: string } }
    const http: Omit<FetchClient, 'sse'> = createFetch<Routes>()
    const full: FetchClient = createSseFetch<Routes>()
    expectTypeOf(http).not.toBeAny()
    expectTypeOf(full).not.toBeAny()
  })
})
