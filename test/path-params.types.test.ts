import { describe, expectTypeOf, it } from 'vitest'
import { createFetch, pathParams } from '../src'
import type { ExtractPathParamKeys, NoParams, PathParamsOf } from '../src'
import { createFetch as createSseFetch } from '../src/sse'
import { createFetch as createLiveFetch } from '../src/live'
import { useSse, useWs } from '../src/react'

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

describe('live path params types', () => {
  it('types sse / ws / transport / stream params like HTTP', () => {
    const live = createLiveFetch({ baseUrl: 'https://api.example.com' })
    type Msg = { text: string }
    type Params = { id: number }

    // Compile-only checks — never invoke (would open connections)
    const typeCheck = async () => {
      // No generics → params inferred from the URL
      live.sse('/orders/:id', { params: { id: 1 }, onMessage: () => undefined })
      live.ws('/rooms/:id', { params: { id: 'a' } })
      live.stream('/chat/{id}', { params: { id: 1 } })
      live.ws('/feed')

      // <Message, Params> → params typed as Params; path must contain the keys
      live.sse<Msg, Params>('/orders/:id', {
        params: { id: 1 },
        onMessage: (message) => expectTypeOf(message).toEqualTypeOf<Msg>(),
      })
      const socket = live.ws<Msg, Params, { hi: string }>('/rooms/:id', { params: { id: 1 } })
      socket.send({ hi: 'x' })
      live.transport<Msg, Params>('/game/:id', { params: { id: 1 } })
      for await (const item of live.stream<Msg, Params>('/chat/:id', { params: { id: 1 } })) {
        expectTypeOf(item).toEqualTypeOf<Msg>()
      }
      for await (const event of live.sse<Msg, Params>('/orders/:id', { params: { id: 1 } })) {
        expectTypeOf(event.data).toEqualTypeOf<Msg>()
      }

      // @ts-expect-error missing params for patterned path (no generics)
      live.ws('/rooms/:id')
      // @ts-expect-error wrong param key from the URL
      live.stream('/chat/:id', { params: { chatId: 1 } })
      // @ts-expect-error <Message, Params> without options
      live.ws<Msg, Params>('/rooms/:id')
      // @ts-expect-error params type does not match the path
      live.sse<Msg, Params>('/orders/:orderId', { params: { id: 1 }, onMessage: () => undefined })
      // @ts-expect-error wrong param value type
      live.transport<Msg, Params>('/game/:id', { params: { id: 'x' } })
    }
    void typeCheck
  })

  it('types useSse / useWs params like HTTP', () => {
    type Msg = { text: string }
    const typeCheck = () => {
      useSse<Msg, { id: number }>('/orders/:id', { params: { id: 1 } })
      useWs<Msg, { id: string }, { hi: string }>('/rooms/:id', { params: { id: 'a' } }).send({
        hi: 'x',
      })
      useWs('/rooms/:id', { params: { id: 'a' } })
      // @ts-expect-error params type does not match the path
      useSse<Msg, { id: number }>('/orders/:orderId', { params: { id: 1 } })
      // @ts-expect-error wrong param key from the URL
      useWs('/rooms/:id', { params: { roomId: 'a' } })
    }
    void typeCheck
  })
})
