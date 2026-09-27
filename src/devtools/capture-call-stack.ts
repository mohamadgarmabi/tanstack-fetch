import type { DevtoolsCallSite } from './devtools.type'

type EditorId = 'cursor' | 'zed' | 'vscode'

type EditorChoice = {
  id: EditorId
  label: string
  buildHref: (absolutePath: string, line: number, column: number) => string
}

const IGNORE_PATH =
  /node_modules|tanstack-fetch\/(?:dist|src)\/(?:devtools|create-fetch|request|interceptors|sse|plugins|utils)|\/vite\/|\/@fs\//i

const FRAME_RE =
  /^\s*at\s+(?:(?<fn>.+?)\s+\()?(?<file>(?:file:\/\/|https?:\/\/|\/)[^):]+?)(?::(?<line>\d+))?(?::(?<col>\d+))?\)?$/

const FRAME_RE_ALT = /^\s*at\s+(?<file>[^:]+):(?<line>\d+):(?<col>\d+)\s*$/

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

const cleanFile = (file: string) => {
  try {
    if (file.startsWith('file://')) return decodeURIComponent(file.replace(/^file:\/\//, ''))
    const url = new URL(file)
    return url.pathname.replace(/^\/@fs/, '') || file
  } catch {
    return file.replace(/\?.*$/, '')
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
  const match = line.match(FRAME_RE) ?? line.match(FRAME_RE_ALT)
  if (!match?.groups) return null
  const fileName = cleanFile(match.groups.file ?? '')
  if (!fileName || IGNORE_PATH.test(fileName)) return null
  return {
    functionName: (match.groups.fn ?? '<anonymous>').trim(),
    fileName,
    line: match.groups.line ? Number(match.groups.line) : undefined,
    column: match.groups.col ? Number(match.groups.col) : undefined,
    raw: line.trim(),
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
  const absolute = path.startsWith('/') ? path : `/${path}`
  const href = editor.buildHref(absolute, line, column)
  const detail = { ...site, path, line, column, editor: editorId }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tf-devtools:open-source', { detail }))
  }

  const anchor = document.createElement('a')
  anchor.href = href
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

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
