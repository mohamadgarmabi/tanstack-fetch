/** Stable id for one live connection, so hooks / DevTools can correlate its messages. */
const createLiveId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `live_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

export { createLiveId }
