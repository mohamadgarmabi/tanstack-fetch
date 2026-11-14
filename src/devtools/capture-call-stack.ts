import type { DevtoolsCallSite } from './devtools.type'

type EditorId = 'cursor' | 'zed' | 'vscode'

type EditorChoice = {
  id: EditorId
  label: string
  buildHref: (absolutePath: string, line: number, column: number) => string
}

const IGNORE_PATH =
  /node_modules|tanstack-fetch\/(?:dist|src)\/(?:devtools|create-fetch|request|interceptors|sse|plugins|utils)|\/vite\/|\/@fs\//i

// V8: `at fn (loc)` / `at loc`. Firefox / Safari: `fn@loc` / `@loc`.
const V8_FRAME_RE = /^at\s+(?:(?<fn>.+?)\s+\((?<loc>.+)\)|(?<bare>.+))$/
const AT_FRAME_RE = /^(?<fn>.*?)@(?<loc>(?:[a-z][\w+.-]*:\/\/|\/).+)$/i
// `:line:col` is parsed from the right so `host:port` in a URL stays in the file part.
const LOCATION_RE = /^(?<file>.+?)(?::(?<line>\d+))?(?::(?<col>\d+))?$/
// Only http(s) / file URLs and plain paths are source files (not `node:internal`, `<anonymous>`, `native`).
const SOURCE_FILE_RE = /^(?:https?:\/\/|file:\/\/|\/|[A-Za-z]:[\\/])/i

const EDITOR_STORAGE_KEY = 'tf-devtools-editor'

const EDITORS: EditorChoice[] = [
  {
    id: 'cursor',
    label: 'Cursor',
    buildHref: (path, line, column) => `cursor://file${path}:${line}:${column}`,
  },
  {
    id: 'zed',
    label: 'Zed',
    buildHref: (path, line, column) => `zed://file${path}:${line}:${column}`,
  },
  {
    id: 'vscode',
    label: 'VS Code',
    buildHref: (path, line, column) => `vscode://file${path}:${line}:${column}`,
  },
]

/**
 * `file:///abs/x.ts` → `/abs/x.ts`; Vite `/@fs/abs/x.ts` → `/abs/x.ts`;
 * dev-server `http://localhost:5173/src/x.ts?t=1` → `src/x.ts` (relative to the project root).
 */
const cleanFile = (file: string) => {
  const noQuery = file.replace(/[?#].*$/, '')
  if (noQuery.startsWith('file://')) return decodeURIComponent(noQuery.replace(/^file:\/\//, ''))
  if (!/^https?:\/\//i.test(noQuery)) return noQuery
  try {
    const pathname = decodeURIComponent(new URL(noQuery).pathname)
    if (pathname.startsWith('/@fs/')) return pathname.slice('/@fs'.length)
    return pathname.replace(/^\/+/, '') || noQuery
  } catch {
    return noQuery
  }
}

const shortName = (file: string) => {
  const parts = file.replace(/\\/g, '/').split('/')
  return parts.slice(-2).join('/') || file
}

const fileBaseName = (file: string) => {
  const parts = file.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || file
}

/** Best label for where the API was called — e.g. `profile.hook.ts`. */
const resolveCallerLabel = (stack: DevtoolsCallSite[]): string | undefined => {
  if (stack.length === 0) return undefined
  const preferred =
    stack.find(
      (site) =>
        /\.(hook|tsx?|jsx?|vue|svelte|mts|cts)$/i.test(site.fileName) ||
        /(?:^|\/)(?:hooks?|components?|views?|modules?|features?|pages?|apis?)\//i.test(
          site.fileName,
        ),
    ) ?? stack[0]
  return preferred ? fileBaseName(preferred.fileName) : undefined
}

const parseFrame = (line: string): DevtoolsCallSite | null => {
  const text = line.trim()
  const groups = text.match(V8_FRAME_RE)?.groups ?? text.match(AT_FRAME_RE)?.groups
  const loc = groups?.loc ?? groups?.bare
  if (!groups || !loc) return null
  const parts = loc.trim().match(LOCATION_RE)?.groups
  if (!parts?.file || !SOURCE_FILE_RE.test(parts.file)) return null
  const fileName = cleanFile(parts.file)
  if (!fileName || IGNORE_PATH.test(fileName)) return null
  return {
    functionName: groups.fn?.trim() || '<anonymous>',
    fileName,
    line: parts.line ? Number(parts.line) : undefined,
    column: parts.col ? Number(parts.col) : undefined,
    raw: text,
  }
}

const captureCallStack = (limit = 12): DevtoolsCallSite[] => {
  const stack = new Error().stack
  if (!stack) return []
  const frames: DevtoolsCallSite[] = []
  const lines = stack.split('\n').slice(1)
  for (const line of lines) {
    if (IGNORE_PATH.test(line) || /captureCallStack|createDevtools|onRequest/.test(line)) {
      continue
    }
    const frame = parseFrame(line)
    if (!frame) continue
    frames.push(frame)
    if (frames.length >= limit) break
  }
  return frames
}

const getStoredEditor = (): EditorId | null => {
  try {
    const value = localStorage.getItem(EDITOR_STORAGE_KEY)
    if (value === 'cursor' || value === 'zed' || value === 'vscode') return value
  } catch {
    // ignore
  }
  return null
}

const setStoredEditor = (id: EditorId) => {
  try {
    localStorage.setItem(EDITOR_STORAGE_KEY, id)
  } catch {
    // ignore
  }
}

const openWithEditor = (site: DevtoolsCallSite, editorId: EditorId) => {
  const editor = EDITORS.find((item) => item.id === editorId)
  if (!editor) return
  const line = site.line ?? 1
  const column = site.column ?? 1
  const path = site.fileName
  const detail = { ...site, path, line, column, editor: editorId }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tf-devtools:open-source', { detail }))
  }

  if (SOURCE_FILE_RE.test(path)) {
    const anchor = document.createElement('a')
    anchor.href = editor.buildHref(path.startsWith('/') ? path : `/${path}`, line, column)
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } else if (typeof fetch === 'function') {
    // Project-relative path from a dev-server URL: only the dev server knows the root, so let
    // Vite's built-in `/__open-in-editor` (launch-editor) resolve it. Other servers just 404.
    void fetch(`/__open-in-editor?file=${encodeURIComponent(`${path}:${line}:${column}`)}`).catch(
      () => undefined,
    )
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(`${path}:${line}:${column}`)
  }

  setStoredEditor(editorId)
  return detail
}

type PromptOpenOptions = {
  site: DevtoolsCallSite
  /** Mount picker relative to this root (devtools dock). */
  host: HTMLElement
}

/**
 * Ask which IDE to open, then deep-link. Remembers last choice as default highlight.
 */
const promptOpenCallSite = (options: PromptOpenOptions) => {
  const { site, host } = options
  const existing = host.querySelector('.tf-dt-ide-picker')
  existing?.remove()

  const overlay = document.createElement('div')
  overlay.className = 'tf-dt-ide-picker'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-label', 'Open in editor')

  const card = document.createElement('div')
  card.className = 'tf-dt-ide-card'

  const title = document.createElement('div')
  title.className = 'tf-dt-ide-title'
  title.textContent = 'Open in…'

  const file = document.createElement('div')
  file.className = 'tf-dt-ide-file'
  file.textContent = `${fileBaseName(site.fileName)}${site.line != null ? `:${site.line}` : ''}`

  const list = document.createElement('div')
  list.className = 'tf-dt-ide-list'

  const last = getStoredEditor()
  EDITORS.forEach((editor) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `tf-dt-ide-btn${last === editor.id ? ' is-last' : ''}`
    btn.textContent = editor.label
    btn.addEventListener('click', () => {
      openWithEditor(site, editor.id)
      overlay.remove()
    })
    list.appendChild(btn)
  })

  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.className = 'tf-dt-ide-cancel'
  cancel.textContent = 'Cancel'
  cancel.addEventListener('click', () => overlay.remove())

  card.append(title, file, list, cancel)
  overlay.appendChild(card)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.remove()
  })
  host.appendChild(overlay)
}

const formatCallSite = (site: DevtoolsCallSite) => {
  const loc =
    site.line != null
      ? `${shortName(site.fileName)}:${site.line}${site.column != null ? `:${site.column}` : ''}`
      : shortName(site.fileName)
  return { label: site.functionName, loc, base: fileBaseName(site.fileName) }
}

export {
  captureCallStack,
  openWithEditor,
  promptOpenCallSite,
  formatCallSite,
  parseFrame,
  shortName,
  fileBaseName,
  resolveCallerLabel,
  EDITORS,
  getStoredEditor,
}
export type { EditorId, EditorChoice }
