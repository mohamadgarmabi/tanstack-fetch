import type {
  CreateDevtoolsOptions,
  DevtoolsEntry,
  DevtoolsKind,
  DevtoolsKindFlags,
  DevtoolsStore,
  DevtoolsStoreListener,
  DevtoolsStoreSnapshot,
} from './devtools.type'

const DEFAULT_FLAGS: DevtoolsKindFlags = {
  http: true,
  sse: true,
  ssr: true,
  trpc: true,
}

const createDevtoolsStore = (options: CreateDevtoolsOptions = {}): DevtoolsStore => {
  const maxEntries = options.maxEntries ?? 200
  let entries: DevtoolsEntry[] = []
  let paused = false
  let selectedId: string | null = null
  let flags: DevtoolsKindFlags = {
    http: options.http ?? true,
    sse: options.sse ?? true,
    ssr: options.ssr ?? true,
    trpc: options.trpc ?? true,
  }
  const listeners = new Set<DevtoolsStoreListener>()

  const snapshot = (): DevtoolsStoreSnapshot => ({
    entries,
    paused,
    flags: { ...flags },
    selectedId,
  })

  const emit = () => {
    const next = snapshot()
    listeners.forEach((listener) => listener(next))
  }

  const getSnapshot = () => snapshot()

  const getById = (id: string) => entries.find((entry) => entry.id === id)

  const list = (kind: DevtoolsKind | 'all' = 'all') => {
    if (kind === 'all') return entries
    return entries.filter((entry) => entry.kind === kind)
  }

  const upsert = (entry: DevtoolsEntry) => {
    if (paused) return
    if (!flags[entry.kind]) return
    const index = entries.findIndex((item) => item.id === entry.id)
    if (index >= 0) {
      entries = [...entries.slice(0, index), entry, ...entries.slice(index + 1)]
    } else {
      entries = [entry, ...entries].slice(0, maxEntries)
    }
    emit()
  }

  const patch = (id: string, partial: Partial<DevtoolsEntry>) => {
    if (paused) return
    const index = entries.findIndex((item) => item.id === id)
    if (index < 0) return
    const current = entries[index]
    if (!current) return
    const next = { ...current, ...partial }
    if (!flags[next.kind]) return
    entries = [...entries.slice(0, index), next, ...entries.slice(index + 1)]
    emit()
  }

  const clear = () => {
    entries = []
    selectedId = null
    emit()
  }

  const setPaused = (next: boolean) => {
    paused = next
    emit()
  }

  const setFlags = (partial: Partial<DevtoolsKindFlags>) => {
    flags = { ...flags, ...partial }
    emit()
  }

  const select = (id: string | null) => {
    selectedId = id
    emit()
  }

  const isKindEnabled = (kind: DevtoolsKind) => flags[kind]

  const subscribe = (listener: DevtoolsStoreListener) => {
    listeners.add(listener)
    listener(snapshot())
    return () => {
      listeners.delete(listener)
    }
  }

  return {
    getSnapshot,
    getById,
    list,
    upsert,
    patch,
    clear,
    setPaused,
    setFlags,
    select,
    isKindEnabled,
    subscribe,
  }
}

export { createDevtoolsStore, DEFAULT_FLAGS }
