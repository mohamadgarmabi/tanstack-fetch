const wait = (delayMs: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, delayMs)
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })

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
  const listeners = active.map((signal) => () => controller.abort(signal.reason))
  const release = () =>
    active.forEach((signal, index) => signal.removeEventListener('abort', listeners[index]))
  active.forEach((signal, index) => {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return
    }
    signal.addEventListener('abort', listeners[index], { once: true })
  })
  controller.signal.addEventListener('abort', release, { once: true })
  fallbackReleases.set(controller.signal, release)
  return controller.signal
}

// Fallback path only: long-lived user signals would otherwise keep one listener per request.
const fallbackReleases = new WeakMap<AbortSignal, () => void>()
const releaseSignal = (signal: AbortSignal | undefined) => {
  if (signal) fallbackReleases.get(signal)?.()
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

export { wait, combineSignals, createTimeoutSignal, releaseSignal }
export type { TimeoutSignal }
