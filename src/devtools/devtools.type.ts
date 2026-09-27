type DevtoolsKind = 'http' | 'sse' | 'ssr' | 'trpc'

type DevtoolsEntryStatus = 'pending' | 'success' | 'error' | 'aborted'

type DevtoolsKindFlags = {
  http: boolean
  sse: boolean
  ssr: boolean
  trpc: boolean
}

type DevtoolsSseEvent = {
  index: number
  id?: string
  event?: string
  data: unknown
  at: number
}

type DevtoolsSseInfo = {
  open: boolean
  eventCount: number
  lastEventId?: string
  lastEventName?: string
  /** Full event list for the stream (newest last). */
  events: DevtoolsSseEvent[]
}

type DevtoolsIncomingInfo = {
  hasCookie: boolean
  hasAuthorization: boolean
  requestId?: string
}

type DevtoolsCallSite = {
  functionName: string
  fileName: string
  line?: number
  column?: number
  raw: string
}

type DevtoolsEntry = {
  id: string
  kind: DevtoolsKind
  status: DevtoolsEntryStatus
  method: string
  url: string
  path: string
  params: Record<string, string>
  query: Record<string, string>
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  body?: unknown
  responseBody?: unknown
  httpStatus?: number
  errorMessage?: string
  timingMs?: number
  requestBytes: number
  responseBytes: number
  attempt: number
  maxRetries: number
  operation?: string
  source?: string
  startedAt: number
  endedAt?: number
  incoming?: DevtoolsIncomingInfo
  sse?: DevtoolsSseInfo
  /** User call sites leading to this request (outermost first). */
  callStack: DevtoolsCallSite[]
  /** Where the API was called from — e.g. `profile.hook.ts`. */
  callerFile?: string
}

type CreateDevtoolsOptions = {
  http?: boolean
  sse?: boolean
  ssr?: boolean
  trpc?: boolean
  maxEntries?: number
  /** Cap SSE events kept per stream. Default 100. */
  maxSseEvents?: number
  /** Redact these request header names (case-insensitive). */
  redactHeaders?: string[]
}

type SetupDevtoolsOptions = CreateDevtoolsOptions & {
  /** Start dock open. Default false. */
  open?: boolean
  target?: HTMLElement
  /** Mount the panel (browser). Default true. */
  mount?: boolean
}

type DevtoolsStoreSnapshot = {
  entries: readonly DevtoolsEntry[]
  paused: boolean
  flags: DevtoolsKindFlags
  selectedId: string | null
}

type DevtoolsStoreListener = (snapshot: DevtoolsStoreSnapshot) => void

type DevtoolsStore = {
  getSnapshot: () => DevtoolsStoreSnapshot
  getById: (id: string) => DevtoolsEntry | undefined
  list: (kind?: DevtoolsKind | 'all') => readonly DevtoolsEntry[]
  upsert: (entry: DevtoolsEntry) => void
  patch: (id: string, patch: Partial<DevtoolsEntry>) => void
  clear: () => void
  setPaused: (paused: boolean) => void
  setFlags: (flags: Partial<DevtoolsKindFlags>) => void
  select: (id: string | null) => void
  isKindEnabled: (kind: DevtoolsKind) => boolean
  subscribe: (listener: DevtoolsStoreListener) => () => void
}

type CreateDevtoolsResult = {
  store: DevtoolsStore
  interceptor: import('../types').HttpInterceptor
  setFlags: (flags: Partial<DevtoolsKindFlags>) => void
}

type MountDevtoolsOptions = {
  store: DevtoolsStore
  /** Mount root. Defaults to `document.body`. */
  target?: HTMLElement
  position?: 'bottom'
  /** Start expanded. Default false. */
  open?: boolean
}

type SetupDevtoolsClient = {
  use: (
    name: string,
    interceptor: import('../types').HttpInterceptor,
    config?: { order?: number },
  ) => void
}

export type {
  DevtoolsKind,
  DevtoolsEntryStatus,
  DevtoolsKindFlags,
  DevtoolsSseEvent,
  DevtoolsSseInfo,
  DevtoolsIncomingInfo,
  DevtoolsCallSite,
  DevtoolsEntry,
  CreateDevtoolsOptions,
  SetupDevtoolsOptions,
  DevtoolsStoreSnapshot,
  DevtoolsStoreListener,
  DevtoolsStore,
  CreateDevtoolsResult,
  MountDevtoolsOptions,
  SetupDevtoolsClient,
}
