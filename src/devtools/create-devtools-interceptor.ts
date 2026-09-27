import type { HttpInterceptor, RequestContext, SseEventContext } from '../types'
import { captureCallStack, resolveCallerLabel } from './capture-call-stack'
import { estimateSize } from './estimate-size'
import { headersToRecord, parsePathParams, parseQuery } from './parse-url-parts'
import type {
  DevtoolsCallSite,
  DevtoolsEntry,
  DevtoolsKind,
  DevtoolsSseEvent,
  DevtoolsSseInfo,
  DevtoolsStore,
} from './devtools.type'

type PendingTiming = {
  startedAt: number
  startMark: number
}

const DEFAULT_REDACT = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
])

const nowMs = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

const wallClock = () => Date.now()

const resolveKind = (context: RequestContext, asSse = false): DevtoolsKind => {
  if (context.meta.operation === 'trpc') return 'trpc'
  if (asSse) return 'sse'
  if (context.meta.source && context.meta.source !== 'browser') return 'ssr'
  if (context.incoming?.cookie || context.incoming?.authorization) return 'ssr'
  return 'http'
}

const entryId = (context: RequestContext) => {
  const requestId = context.meta.requestId ?? 'anon'
  return `${requestId}:${context.meta.attempt}`
}

const responseByteSize = (context: RequestContext): number => {
  const length = context.response?.headers.get('content-length')
  if (length) {
    const parsed = Number(length)
    if (!Number.isNaN(parsed)) return parsed
  }
  return estimateSize(context.data ?? context.error)
}

const emptySse = (partial?: Partial<DevtoolsSseInfo>): DevtoolsSseInfo => ({
  open: false,
  eventCount: 0,
  events: [],
  ...partial,
})

const createPendingEntry = (
  context: RequestContext,
  redact: Set<string>,
  kind: DevtoolsKind,
  idOverride?: string,
  callStack: DevtoolsCallSite[] = [],
): DevtoolsEntry => {
  const url = context.request.url
  return {
    id: idOverride ?? entryId(context),
    kind,
    status: 'pending',
    method: context.request.method,
    url: url.href,
    path: url.pathname,
    params: parsePathParams(url.pathname),
    query: parseQuery(url),
    requestHeaders: headersToRecord(context.request.headers, redact),
    responseHeaders: {},
    body: context.request.body,
    requestBytes: estimateSize(context.request.body),
    responseBytes: 0,
    attempt: context.meta.attempt,
    maxRetries: context.meta.maxRetries,
    operation: context.meta.operation,
    source: context.meta.source,
    startedAt: wallClock(),
    callStack,
    callerFile: resolveCallerLabel(callStack),
    incoming: context.incoming
      ? {
          hasCookie: Boolean(context.incoming.cookie),
          hasAuthorization: Boolean(context.incoming.authorization),
          requestId: context.incoming.requestId,
        }
      : undefined,
  }
}

const createDevtoolsInterceptor = (
  store: DevtoolsStore,
  options?: { redactHeaders?: string[]; maxSseEvents?: number },
): HttpInterceptor => {
  const redact = new Set([
    ...DEFAULT_REDACT,
    ...(options?.redactHeaders ?? []).map((name) => name.toLowerCase()),
  ])
  const maxSseEvents = options?.maxSseEvents ?? 100
  const pending = new Map<string, PendingTiming>()
  /** SSE event contexts are rebuilt without `meta.requestId` — map path → entry id. */
  const sseStreamIds = new Map<string, string>()

  const finish = (
    context: RequestContext,
    status: DevtoolsEntry['status'],
    extra: Partial<DevtoolsEntry> & { id?: string } = {},
  ) => {
    const id = extra.id ?? entryId(context)
    const timing = pending.get(id)
    pending.delete(id)
    const timingMs = timing ? Math.max(0, nowMs() - timing.startMark) : undefined
    const existing = store.getById(id)
    const kind = extra.kind ?? existing?.kind ?? resolveKind(context)
    if (!store.isKindEnabled(kind)) return

    const { id: _id, ...restExtra } = extra

    store.upsert({
      ...(existing ?? createPendingEntry(context, redact, kind, id)),
      id,
      kind,
      status,
      httpStatus: context.response?.status ?? context.error?.status,
      errorMessage: context.error?.message,
      responseBody: context.data ?? context.error,
      responseHeaders: context.response
        ? headersToRecord(context.response.headers, redact)
        : (existing?.responseHeaders ?? {}),
      responseBytes: responseByteSize(context),
      timingMs,
      endedAt: wallClock(),
      attempt: context.meta.attempt,
      callStack: existing?.callStack ?? [],
      ...restExtra,
    })
  }

  const resolveSseId = (context: RequestContext) =>
    sseStreamIds.get(context.request.url.pathname) ?? entryId(context)

  return {
    name: 'devtools',
    order: 200,
    onRequest: (context) => {
      const kind = resolveKind(context)
      if (!store.isKindEnabled(kind)) return { action: 'continue' }
      const id = entryId(context)
      const callStack = captureCallStack()
      pending.set(id, { startedAt: wallClock(), startMark: nowMs() })
      store.upsert(createPendingEntry(context, redact, kind, id, callStack))

      const signal = context.request.signal
      if (signal) {
        const onAbort = () => {
          if (store.getById(id)?.status === 'pending') {
            finish(context, 'aborted', { id })
          }
        }
        if (signal.aborted) onAbort()
        else signal.addEventListener('abort', onAbort, { once: true })
      }

      return { action: 'continue' }
    },
    onResponse: (context) => {
      finish(context, 'success')
      return { action: 'continue' }
    },
    onResponseError: (context) => {
      finish(context, 'error')
      return { action: 'continue' }
    },
    onRequestError: (context) => {
      finish(context, 'error')
      return { action: 'continue' }
    },
    onSseOpen: (context) => {
      const id = entryId(context)
      const kind: DevtoolsKind = 'sse'
      if (!store.isKindEnabled(kind)) return { action: 'continue' }
      sseStreamIds.set(context.request.url.pathname, id)
      const existing = store.getById(id)
      store.upsert({
        ...(existing ?? createPendingEntry(context, redact, kind, id)),
        id,
        kind,
        status: 'pending',
        httpStatus: context.response?.status ?? 200,
        responseHeaders: context.response ? headersToRecord(context.response.headers, redact) : {},
        callStack: existing?.callStack ?? captureCallStack(),
        callerFile:
          existing?.callerFile ?? resolveCallerLabel(existing?.callStack ?? captureCallStack()),
        sse: emptySse({
          open: true,
          eventCount: existing?.sse?.eventCount ?? 0,
          events: existing?.sse?.events ?? [],
          lastEventId: context.meta.lastEventId,
        }),
      })
      return { action: 'continue' }
    },
    onSseEvent: (context: SseEventContext) => {
      if (!store.isKindEnabled('sse')) return { action: 'continue' }
      const id = resolveSseId(context)
      const existing = store.getById(id)
      const prevEvents = existing?.sse?.events ?? []
      const nextEvent: DevtoolsSseEvent = {
        index: prevEvents.length + 1,
        id: context.event.id,
        event: context.event.event,
        data: context.event.data,
        at: wallClock(),
      }
      const events = [...prevEvents, nextEvent].slice(-maxSseEvents)
      const eventCount = events.length
      const sse = emptySse({
        open: true,
        eventCount,
        events,
        lastEventId: context.event.id ?? existing?.sse?.lastEventId,
        lastEventName: context.event.event,
      })
      if (!existing) {
        store.upsert({
          ...createPendingEntry(context, redact, 'sse', id),
          kind: 'sse',
          status: 'pending',
          responseBody: context.event.data,
          sse,
        })
      } else {
        store.patch(id, {
          kind: 'sse',
          status: 'pending',
          responseBody: context.event.data,
          sse,
        })
      }
      return { action: 'continue' }
    },
    onSseError: (context) => {
      const id = resolveSseId(context)
      const existing = store.getById(id)
      finish(context, 'error', {
        id,
        kind: 'sse',
        sse: emptySse({
          open: false,
          eventCount: existing?.sse?.eventCount ?? 0,
          events: existing?.sse?.events ?? [],
          lastEventId: context.meta.lastEventId,
          lastEventName: existing?.sse?.lastEventName,
        }),
      })
      sseStreamIds.delete(context.request.url.pathname)
      return { action: 'continue' }
    },
    onSseReconnect: (context) => {
      const id = resolveSseId(context)
      store.patch(id, {
        kind: 'sse',
        status: 'pending',
        attempt: context.meta.attempt,
      })
      return { action: 'continue' }
    },
    onSseClose: (context) => {
      const id = resolveSseId(context)
      const existing = store.getById(id)
      if (!existing) return { action: 'continue' }
      // Aborted streams already finished via signal listener.
      if (existing.status === 'aborted' || existing.status === 'error') {
        return { action: 'continue' }
      }
      finish(context, 'success', {
        id,
        kind: 'sse',
        httpStatus: existing.httpStatus ?? context.response?.status ?? 200,
        sse: emptySse({
          open: false,
          eventCount: existing.sse?.eventCount ?? 0,
          events: existing.sse?.events ?? [],
          lastEventId: existing.sse?.lastEventId ?? context.meta.lastEventId,
          lastEventName: existing.sse?.lastEventName,
        }),
      })
      sseStreamIds.delete(context.request.url.pathname)
      return { action: 'continue' }
    },
  }
}

/** Mark an SSE stream closed successfully (call from host when stream ends). */
const completeSseEntry = (store: DevtoolsStore, context: RequestContext) => {
  const id = entryId(context)
  const existing = store.getById(id)
  if (!existing) return
  const timing = existing.startedAt ? wallClock() - existing.startedAt : undefined
  store.patch(id, {
    status: 'success',
    timingMs: timing,
    endedAt: wallClock(),
    sse: existing.sse ? { ...existing.sse, open: false } : undefined,
  })
}

export { createDevtoolsInterceptor, resolveKind, entryId, completeSseEntry }
