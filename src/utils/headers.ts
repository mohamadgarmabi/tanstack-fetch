import type { MaybePromise } from '../types'

const toHeaders = (init?: HeadersInit) => new Headers(init)

const mergeHeaders = (...inits: Array<HeadersInit | undefined>) => {
  const headers = new Headers()
  inits.forEach((init) => {
    if (!init) {
      return
    }
    new Headers(init).forEach((value, key) => {
      headers.set(key, value)
    })
  })
  return headers
}

const resolveHeaders = async (value?: HeadersInit | (() => MaybePromise<HeadersInit>)) => {
  if (!value) {
    return new Headers()
  }
  const resolved = typeof value === 'function' ? await value() : value
  return toHeaders(resolved)
}

export { toHeaders, mergeHeaders, resolveHeaders }
