import { formatCallSite, promptOpenCallSite } from '../capture-call-stack'
import { formatBytes } from '../estimate-size'
import type {
  DevtoolsEntry,
  DevtoolsKind,
  DevtoolsStore,
  MountDevtoolsOptions,
} from '../devtools.type'
import { injectStyles } from './mount-devtools.styles'

type TabId = 'all' | DevtoolsKind

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'http', label: 'HTTP' },
  { id: 'sse', label: 'SSE' },
  { id: 'ssr', label: 'SSR' },
  { id: 'trpc', label: 'tRPC' },
]

const pretty = (value: unknown) => {
  if (value === undefined) return '—'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const appendSection = (parent: HTMLElement, title: string, content: HTMLElement | string) => {
  const h = document.createElement('h3')
  h.textContent = title
  parent.appendChild(h)
  if (typeof content === 'string') {
    const pre = document.createElement('pre')
    pre.className = 'tf-dt-block'
    pre.textContent = content
    parent.appendChild(pre)
  } else {
    parent.appendChild(content)
  }
}

const mountDevtools = (options: MountDevtoolsOptions) => {
  if (typeof document === 'undefined') {
    return { destroy: () => undefined, open: () => undefined, close: () => undefined }
  }

  injectStyles()

  const store = options.store
  const target = options.target ?? document.body
  let open = Boolean(options.open)
  let activeTab: TabId = 'all'
  let height = 300

  const root = document.createElement('div')
  root.className = 'tf-dt-root'
  root.setAttribute('data-tf-devtools', 'true')

  const handle = document.createElement('button')
  handle.type = 'button'
  handle.className = 'tf-dt-handle'
  handle.textContent = 'Fetch'

  const dock = document.createElement('div')
  dock.className = 'tf-dt-dock'
  dock.style.setProperty('--tf-dt-height', `${height}px`)

  const resize = document.createElement('div')
  resize.className = 'tf-dt-resize'

  const toolbar = document.createElement('div')
  toolbar.className = 'tf-dt-toolbar'

  const title = document.createElement('span')
  title.className = 'tf-dt-title'
  title.textContent = 'DevTools'

  const tabsEl = document.createElement('div')
  tabsEl.className = 'tf-dt-tabs'

  const actions = document.createElement('div')
  actions.className = 'tf-dt-actions'

  const pauseBtn = document.createElement('button')
  pauseBtn.type = 'button'
  pauseBtn.className = 'tf-dt-btn'
  pauseBtn.textContent = 'Pause'

  const clearBtn = document.createElement('button')
  clearBtn.type = 'button'
  clearBtn.className = 'tf-dt-btn'
  clearBtn.textContent = 'Clear'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'tf-dt-btn'
  closeBtn.textContent = '×'

  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)

  const hint = document.createElement('span')
  hint.className = 'tf-dt-hint'
  hint.textContent = isMac ? '⌥⇧F' : 'Alt+Shift+F'
  hint.title = 'Toggle dock: Alt+Shift+F (⌥⇧F on macOS)'

  actions.append(pauseBtn, clearBtn, closeBtn)
  toolbar.append(title, tabsEl, hint, actions)

  const body = document.createElement('div')
  body.className = 'tf-dt-body'

  const listEl = document.createElement('div')
  listEl.className = 'tf-dt-list'

  const detailEl = document.createElement('div')
  detailEl.className = 'tf-dt-detail'

  body.append(listEl, detailEl)
  dock.append(resize, toolbar, body)
  root.append(handle, dock)
  target.appendChild(root)

  const setOpen = (next: boolean) => {
    open = next
    root.classList.toggle('is-open', open)
    handle.textContent = open ? 'Hide' : 'Fetch'
  }

  const renderTabs = (storeRef: DevtoolsStore) => {
    const flags = storeRef.getSnapshot().flags
    tabsEl.replaceChildren()
    TABS.forEach((tab) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `tf-dt-tab${activeTab === tab.id ? ' is-active' : ''}`
      btn.textContent = tab.label
      if (tab.id !== 'all' && !flags[tab.id]) {
        btn.disabled = true
      }
      btn.addEventListener('click', () => {
        activeTab = tab.id
        render()
      })
      tabsEl.appendChild(btn)
    })
  }

  const renderCallGraph = (entry: DevtoolsEntry) => {
    const wrap = document.createElement('div')
    wrap.className = 'tf-dt-graph'

    const sites = entry.callStack.length
      ? entry.callStack
      : [
          {
            functionName: entry.method,
            fileName: entry.path,
            raw: `${entry.method} ${entry.path}`,
          },
        ]

    const nodes = [...sites].reverse()
    nodes.forEach((site, index) => {
      const isLeaf = index === nodes.length - 1
      const row = document.createElement('div')
      row.className = 'tf-dt-graph-node'

      const rail = document.createElement('div')
      rail.className = 'tf-dt-graph-rail'
      const dot = document.createElement('div')
      dot.className = `tf-dt-graph-dot${isLeaf ? ' is-leaf' : ''}`
      rail.appendChild(dot)
      if (!isLeaf) {
        const line = document.createElement('div')
        line.className = 'tf-dt-graph-line'
        rail.appendChild(line)
      }

      const card = document.createElement('button')
      card.type = 'button'
      card.className = 'tf-dt-graph-card'
      card.title = 'Choose editor: Cursor / Zed / VS Code'
      const { label, loc, base } = formatCallSite(site)
      const fn = document.createElement('span')
      fn.className = 'tf-dt-graph-fn'
      if (isLeaf) {
        fn.textContent = `${entry.method} ${entry.path}`
      } else {
        fn.textContent = `${base}${label && label !== '<anonymous>' ? ` · ${label}` : ''}`
      }
      const locEl = document.createElement('span')
      locEl.className = 'tf-dt-graph-loc'
      locEl.textContent = isLeaf && entry.callStack.length === 0 ? entry.kind : loc
      card.append(fn, locEl)
      card.addEventListener('click', () => {
        promptOpenCallSite({ site, host: detailEl })
      })

      row.append(rail, card)
      wrap.appendChild(row)
    })

    return wrap
  }

  const renderSseEvents = (entry: DevtoolsEntry) => {
    const wrap = document.createElement('div')
    wrap.className = 'tf-dt-events'
    const events = entry.sse?.events ?? []
    if (events.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'tf-dt-empty'
      empty.textContent = 'No SSE events yet'
      wrap.appendChild(empty)
      return wrap
    }
    ;[...events].reverse().forEach((item) => {
      const card = document.createElement('div')
      card.className = 'tf-dt-event'
      const head = document.createElement('div')
      head.className = 'tf-dt-event-head'
      head.textContent = `#${item.index}${item.event ? ` · ${item.event}` : ''}${item.id ? ` · id ${item.id}` : ''}`
      const pre = document.createElement('pre')
      pre.textContent = pretty(item.data)
      card.append(head, pre)
      wrap.appendChild(card)
    })
    return wrap
  }

  const renderDetail = (entry: DevtoolsEntry | undefined) => {
    detailEl.replaceChildren()
    if (!entry) {
      const empty = document.createElement('div')
      empty.className = 'tf-dt-empty'
      empty.textContent = 'Select a request — call graph, SSE list, body.'
      detailEl.appendChild(empty)
      return
    }

    const summary = document.createElement('div')
    summary.className = 'tf-dt-summary'
    const caller = entry.callerFile
      ? `<span class="tf-dt-caller-badge" title="Called from">${entry.callerFile}</span>`
      : ''
    summary.innerHTML = `
      <span><strong>${entry.method}</strong> ${entry.path}</span>
      ${caller}
      <span>${entry.status}${entry.httpStatus != null ? ` · ${entry.httpStatus}` : ''}</span>
      <span>${entry.timingMs != null ? `${Math.round(entry.timingMs)} ms` : '—'}</span>
      <span>${formatBytes(entry.requestBytes)} → ${formatBytes(entry.responseBytes)}</span>
    `
    detailEl.appendChild(summary)

    appendSection(detailEl, 'Call graph', renderCallGraph(entry))

    if (entry.kind === 'sse' || entry.sse) {
      appendSection(detailEl, `SSE events (${entry.sse?.eventCount ?? 0})`, renderSseEvents(entry))
    }

    appendSection(detailEl, 'Query', pretty(entry.query))
    appendSection(detailEl, 'Params', pretty(entry.params))
    appendSection(detailEl, 'Body', pretty(entry.body))
    appendSection(detailEl, 'Response', pretty(entry.responseBody))
    if (entry.incoming) {
      appendSection(detailEl, 'Incoming', pretty(entry.incoming))
    }
  }

  const renderList = (entries: readonly DevtoolsEntry[], selectedId: string | null) => {
    listEl.replaceChildren()
    if (entries.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'tf-dt-empty'
      empty.textContent = 'No requests yet'
      listEl.appendChild(empty)
      return
    }

    entries.forEach((entry) => {
      const row = document.createElement('button')
      row.type = 'button'
      row.className = `tf-dt-row${selectedId === entry.id ? ' is-selected' : ''}`
      const sseHint = entry.kind === 'sse' && entry.sse ? ` · ${entry.sse.eventCount} evt` : ''
      const caller = entry.callerFile ?? '—'
      row.innerHTML = `
        <span class="tf-dt-method">${entry.method}</span>
        <span class="tf-dt-path" title="${entry.url}">${entry.path}${sseHint}</span>
        <span class="tf-dt-caller" title="Called from">${caller}</span>
        <span class="tf-dt-pill ${entry.status}">${entry.status}</span>
        <span class="tf-dt-meta">${entry.timingMs != null ? `${Math.round(entry.timingMs)}ms` : '—'}</span>
      `
      row.addEventListener('click', () => store.select(entry.id))
      listEl.appendChild(row)
    })
  }

  const render = () => {
    const snap = store.getSnapshot()
    pauseBtn.textContent = snap.paused ? 'Resume' : 'Pause'
    renderTabs(store)
    const entries =
      activeTab === 'all' ? snap.entries : snap.entries.filter((item) => item.kind === activeTab)
    renderList(entries, snap.selectedId)
    renderDetail(snap.selectedId ? store.getById(snap.selectedId) : undefined)
  }

  handle.addEventListener('click', () => setOpen(!open))
  closeBtn.addEventListener('click', () => setOpen(false))
  clearBtn.addEventListener('click', () => store.clear())
  pauseBtn.addEventListener('click', () => {
    store.setPaused(!store.getSnapshot().paused)
  })

  const onKey = (event: KeyboardEvent) => {
    // Alt+Shift+F — Fetch DevTools (⌥⇧F on macOS).
    if (
      event.code !== 'KeyF' ||
      !event.shiftKey ||
      !event.altKey ||
      event.metaKey ||
      event.ctrlKey
    ) {
      return
    }

    const focusTarget = event.target as HTMLElement | null
    const tag = focusTarget?.tagName
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      focusTarget?.isContentEditable
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setOpen(!open)
  }
  window.addEventListener('keydown', onKey, true)

  let resizing = false
  let startY = 0
  let startHeight = height
  resize.addEventListener('pointerdown', (event) => {
    resizing = true
    startY = event.clientY
    startHeight = height
    resize.setPointerCapture(event.pointerId)
  })
  resize.addEventListener('pointermove', (event) => {
    if (!resizing) return
    const delta = startY - event.clientY
    height = Math.min(Math.max(160, startHeight + delta), Math.floor(window.innerHeight * 0.7))
    dock.style.setProperty('--tf-dt-height', `${height}px`)
  })
  resize.addEventListener('pointerup', () => {
    resizing = false
  })

  const unsubscribe = store.subscribe(() => render())
  setOpen(open)
  render()

  return {
    destroy: () => {
      unsubscribe()
      window.removeEventListener('keydown', onKey, true)
      root.remove()
    },
    open: () => setOpen(true),
    close: () => setOpen(false),
    root,
  }
}

export { mountDevtools }
