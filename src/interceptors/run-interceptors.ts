import { DEFAULT_INTERCEPTOR_ORDER } from '../constants'
import type { HttpInterceptor, HttpResult, InterceptorHandler, RequestContext } from '../types'

type HookOutcome<T> =
  | { type: 'continue'; context: T }
  | { type: 'drop' }
  | { type: 'retry'; delayMs?: number }
  | { type: 'short-circuit'; result: HttpResult<unknown, unknown> }

const matchesInterceptor = (interceptor: HttpInterceptor, context: RequestContext) => {
  const match = interceptor.match
  if (!match) {
    return true
  }
  if (match.operation && match.operation !== context.meta.operation) {
    return false
  }
  if (match.method && match.method !== context.request.method) {
    return false
  }
  if (match.pathPrefix && !context.request.url.pathname.startsWith(match.pathPrefix)) {
    return false
  }
  if (match.status !== undefined && context.response?.status !== match.status) {
    return false
  }
  return true
}

const resolveInterceptors = (
  clientInterceptors: HttpInterceptor[],
  extras?: { use?: HttpInterceptor[]; eject?: string[] },
) => {
  const ejected = new Set(extras?.eject ?? [])
  const merged = [...clientInterceptors, ...(extras?.use ?? [])].filter(
    (item) => !ejected.has(item.name),
  )
  return merged.sort(
    (left, right) =>
      (left.order ?? DEFAULT_INTERCEPTOR_ORDER) - (right.order ?? DEFAULT_INTERCEPTOR_ORDER),
  )
}

const runHook = async <T extends RequestContext>(
  interceptors: HttpInterceptor[],
  getHandler: (item: HttpInterceptor) => InterceptorHandler<T> | undefined,
  context: T,
): Promise<HookOutcome<T>> => {
  let current = context
  for (const interceptor of interceptors) {
    if (!matchesInterceptor(interceptor, current)) {
      continue
    }
    const handler = getHandler(interceptor)
    if (!handler) {
      continue
    }
    const decision = (await handler(current)) ?? { action: 'continue', context: current }
    if (decision.action === 'skip') {
      continue
    }
    if (decision.action === 'drop') {
      return { type: 'drop' }
    }
    if (decision.action === 'retry') {
      return { type: 'retry', delayMs: decision.delayMs }
    }
    if (decision.action === 'short-circuit') {
      return { type: 'short-circuit', result: decision.result }
    }
    current = (decision.context ?? current) as T
  }
  return { type: 'continue', context: current }
}

export { resolveInterceptors, runHook }
export type { HookOutcome }
