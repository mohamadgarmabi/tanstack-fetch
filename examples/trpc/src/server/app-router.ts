import { initTRPC } from '@trpc/server'
import type { CreatePostInput, Post } from '../posts.type'

const t = initTRPC.create()

const posts: Post[] = [
  { id: 1, title: 'Typed Fetch for TanStack Query' },
  { id: 2, title: 'tRPC + createFetch' },
]

const appRouter = t.router({
  post: t.router({
    list: t.procedure.query(() => posts),
    create: t.procedure
      .input((value: unknown): CreatePostInput => {
        const title = (value as CreatePostInput | undefined)?.title
        if (typeof title !== 'string' || !title.trim()) {
          throw new Error('title is required')
        }
        return { title: title.trim() }
      })
      .mutation(({ input }) => {
        const post: Post = { id: posts.length + 1, title: input.title }
        posts.push(post)
        return post
      }),
  }),
})

type AppRouter = typeof appRouter

export { appRouter }
export type { AppRouter }
