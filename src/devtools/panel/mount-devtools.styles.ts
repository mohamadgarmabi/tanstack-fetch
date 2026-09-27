const STYLE_ID = 'tf-dt-styles'

const CSS = `
.tf-dt-root {
  --tf-dt-bg: #111114;
  --tf-dt-panel: #18181c;
  --tf-dt-line: #2e2e36;
  --tf-dt-text: #ececf1;
  --tf-dt-muted: #9494a3;
  --tf-dt-accent: #e85d04;
  --tf-dt-ok: #3dd68c;
  --tf-dt-err: #f07178;
  --tf-dt-pending: #61afef;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  z-index: 2147483000;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12.5px;
  color: var(--tf-dt-text);
  pointer-events: none;
}
.tf-dt-root * { box-sizing: border-box; }
.tf-dt-handle {
  pointer-events: auto;
  position: absolute;
  right: 14px;
  bottom: 100%;
  margin-bottom: 8px;
  border: 1px solid var(--tf-dt-line);
  background: var(--tf-dt-panel);
  color: var(--tf-dt-text);
  border-radius: 8px;
  padding: 6px 11px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
}
.tf-dt-handle:hover { border-color: var(--tf-dt-accent); }
.tf-dt-dock {
  pointer-events: auto;
  display: none;
  flex-direction: column;
  height: var(--tf-dt-height, 300px);
  max-height: 70vh;
  background: var(--tf-dt-bg);
  border-top: 1px solid var(--tf-dt-line);
}
.tf-dt-root.is-open .tf-dt-dock { display: flex; }
.tf-dt-resize {
  height: 4px;
  cursor: ns-resize;
  flex: 0 0 auto;
}
.tf-dt-resize:hover { background: rgba(232,93,4,.4); }
.tf-dt-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--tf-dt-line);
  background: var(--tf-dt-panel);
  flex: 0 0 auto;
}
.tf-dt-title { font-weight: 700; margin-right: 4px; }
.tf-dt-tabs { display: flex; gap: 2px; flex-wrap: wrap; flex: 1; }
.tf-dt-tab {
  border: 0;
  background: transparent;
  color: var(--tf-dt-muted);
  padding: 5px 9px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.tf-dt-tab.is-active { background: rgba(232,93,4,.16); color: var(--tf-dt-text); }
.tf-dt-tab:disabled { opacity: .35; cursor: not-allowed; }
.tf-dt-actions { display: flex; gap: 4px; }
.tf-dt-btn {
  border: 1px solid var(--tf-dt-line);
  background: transparent;
  color: var(--tf-dt-text);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11px;
}
.tf-dt-btn:hover { border-color: var(--tf-dt-accent); }
.tf-dt-hint { color: var(--tf-dt-muted); font-size: 11px; }
.tf-dt-body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(260px, 1fr);
  flex: 1;
  min-height: 0;
}
.tf-dt-list { overflow: auto; border-right: 1px solid var(--tf-dt-line); }
.tf-dt-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) minmax(72px, auto) auto auto;
  gap: 8px;
  align-items: center;
  padding: 7px 10px;
  border: 0;
  border-bottom: 1px solid rgba(46,46,54,.8);
  cursor: pointer;
  width: 100%;
  text-align: left;
  background: transparent;
  color: inherit;
  font: inherit;
}
.tf-dt-row:hover { background: rgba(255,255,255,.03); }
.tf-dt-row.is-selected { background: rgba(232,93,4,.1); }
.tf-dt-method {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 700;
  font-size: 11px;
  color: var(--tf-dt-accent);
}
.tf-dt-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tf-dt-caller {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #c4b5fd;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.tf-dt-meta { color: var(--tf-dt-muted); font-variant-numeric: tabular-nums; font-size: 11px; }
.tf-dt-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.tf-dt-pill.pending { background: rgba(97,175,239,.15); color: var(--tf-dt-pending); }
.tf-dt-pill.success { background: rgba(61,214,140,.15); color: var(--tf-dt-ok); }
.tf-dt-pill.error, .tf-dt-pill.aborted { background: rgba(240,113,120,.15); color: var(--tf-dt-err); }
.tf-dt-detail {
  overflow: auto;
  padding: 10px 12px;
  background: #0e0e11;
  position: relative;
}
.tf-dt-detail h3 {
  margin: 0 0 6px;
  font-size: 11px;
  color: var(--tf-dt-muted);
  text-transform: uppercase;
  letter-spacing: .05em;
}
.tf-dt-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 12px;
  color: var(--tf-dt-muted);
}
.tf-dt-summary strong { color: var(--tf-dt-text); font-weight: 600; }
.tf-dt-summary .tf-dt-caller-badge {
  color: #c4b5fd;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.tf-dt-graph {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 14px;
}
.tf-dt-graph-node {
  display: grid;
  grid-template-columns: 16px 1fr;
  gap: 8px;
  align-items: stretch;
}
.tf-dt-graph-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tf-dt-graph-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--tf-dt-accent);
  flex: 0 0 auto;
  margin-top: 8px;
}
.tf-dt-graph-dot.is-leaf { background: var(--tf-dt-pending); }
.tf-dt-graph-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  background: var(--tf-dt-line);
}
.tf-dt-graph-card {
  border: 1px solid var(--tf-dt-line);
  background: var(--tf-dt-panel);
  border-radius: 8px;
  padding: 7px 10px;
  margin-bottom: 6px;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;
  width: 100%;
}
.tf-dt-graph-card:hover { border-color: var(--tf-dt-accent); }
.tf-dt-graph-fn { font-weight: 700; display: block; }
.tf-dt-graph-loc {
  color: var(--tf-dt-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}
.tf-dt-ide-picker {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  padding: 12px;
}
.tf-dt-ide-card {
  background: var(--tf-dt-panel);
  border: 1px solid var(--tf-dt-line);
  border-radius: 12px;
  padding: 14px;
  width: min(280px, 100%);
  box-shadow: 0 16px 40px rgba(0,0,0,.45);
}
.tf-dt-ide-title {
  font-weight: 700;
  margin-bottom: 4px;
}
.tf-dt-ide-file {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #c4b5fd;
  margin-bottom: 12px;
  word-break: break-all;
}
.tf-dt-ide-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}
.tf-dt-ide-btn {
  border: 1px solid var(--tf-dt-line);
  background: #121216;
  color: var(--tf-dt-text);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  text-align: left;
}
.tf-dt-ide-btn:hover { border-color: var(--tf-dt-accent); }
.tf-dt-ide-btn.is-last {
  border-color: rgba(232,93,4,.55);
  background: rgba(232,93,4,.12);
}
.tf-dt-ide-cancel {
  border: 0;
  background: transparent;
  color: var(--tf-dt-muted);
  cursor: pointer;
  font: inherit;
  width: 100%;
  padding: 6px;
}
.tf-dt-ide-cancel:hover { color: var(--tf-dt-text); }
.tf-dt-events {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  max-height: 180px;
  overflow: auto;
}
.tf-dt-event {
  border: 1px solid var(--tf-dt-line);
  border-radius: 8px;
  padding: 6px 8px;
  background: #121216;
}
.tf-dt-event-head {
  display: flex;
  gap: 8px;
  color: var(--tf-dt-muted);
  font-size: 11px;
  margin-bottom: 4px;
}
.tf-dt-event pre {
  margin: 0;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 72px;
  overflow: auto;
}
.tf-dt-detail pre.tf-dt-block {
  margin: 0 0 12px;
  padding: 8px;
  border-radius: 8px;
  background: #0a0a0c;
  border: 1px solid var(--tf-dt-line);
  overflow: auto;
  max-height: 120px;
  font-size: 11px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}
.tf-dt-empty {
  padding: 20px;
  color: var(--tf-dt-muted);
  text-align: center;
}
@media (max-width: 800px) {
  .tf-dt-body { grid-template-columns: 1fr; }
  .tf-dt-detail { border-top: 1px solid var(--tf-dt-line); max-height: 45%; }
  .tf-dt-caller { display: none; }
}
`

const injectStyles = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

export { injectStyles, STYLE_ID }
