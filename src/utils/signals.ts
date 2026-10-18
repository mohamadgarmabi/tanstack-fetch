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

type TimeoutSignal = {
  signal: AbortSignal
  clear: () => void
}

const createTimeoutError = () => {
  const message = 'tanstack-fetch: request timed out'
  if (typeof DOMException === 'function') {
    return new DOMException(message, 'TimeoutError')
  }
  const error = new Error(message)
  error.name = 'TimeoutError'
  return error
}

const createTimeoutSignal = (timeoutMs: number | undefined): TimeoutSignal | undefined => {
  if (!timeoutMs || timeoutMs <= 0) {
    return undefined
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(createTimeoutError()), timeoutMs)
  // Never keep a Node/SSR process alive just for a pending timeout.
  ;(timer as { unref?: () => void }).unref?.()
  const clear = () => clearTimeout(timer)
  controller.signal.addEventListener('abort', clear, { once: true })
  return { signal: controller.signal, clear }
}

export { wait, combineSignals, createTimeoutSignal }
export type { TimeoutSignal }
