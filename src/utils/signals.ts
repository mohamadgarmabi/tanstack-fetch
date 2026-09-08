const wait = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs))

const combineSignals = (signals: Array<AbortSignal | undefined>) => {
  const active = signals.filter((signal): signal is AbortSignal => Boolean(signal))
  if (active.length === 0) {
    return undefined
  }
  if (active.length === 1) {
    return active[0]
  }
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any(active)
  }
  const controller = new AbortController()
  active.forEach((signal) => {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  })
  return controller.signal
}

const createTimeoutSignal = (timeoutMs: number | undefined) => {
  if (!timeoutMs || timeoutMs <= 0) {
    return undefined
  }
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new Error('typed-ssr-http: request timed out')),
    timeoutMs,
  )
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
  return controller.signal
}

export { wait, combineSignals, createTimeoutSignal }
