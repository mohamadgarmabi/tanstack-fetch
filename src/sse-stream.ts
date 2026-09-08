import type { SseEvent } from './types'
import { createSseIterator } from './sse-iterator'
import type { SendSseArgs } from './sse-context'

const sendSse = <T>(args: SendSseArgs): AsyncIterable<SseEvent<T>> => ({
  [Symbol.asyncIterator]: () => createSseIterator<T>(args),
})

export { sendSse }
export type { SendSseArgs }
