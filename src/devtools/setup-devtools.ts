import { createDevtools } from './create-devtools'
import { mountDevtools } from './panel/mount-devtools'
import type {
  CreateDevtoolsResult,
  SetupDevtoolsClient,
  SetupDevtoolsOptions,
} from './devtools.type'

type SetupDevtoolsResult = CreateDevtoolsResult & {
  panel: ReturnType<typeof mountDevtools> | null
  destroy: () => void
}

/**
 * One-line install: registers the interceptor and mounts the dock.
 *
 * ```ts
 * const api = createFetch({ plugins: ['trace'] })
 * setupDevtools(api)
 * ```
 */
const setupDevtools = (
  api: SetupDevtoolsClient,
  options: SetupDevtoolsOptions = {},
): SetupDevtoolsResult => {
  const created = createDevtools(options)
  api.use('devtools', created.interceptor, { order: 200 })

  const shouldMount = options.mount !== false && typeof document !== 'undefined'
  const panel = shouldMount
    ? mountDevtools({
        store: created.store,
        target: options.target,
        open: options.open,
      })
    : null

  return {
    ...created,
    panel,
    destroy: () => {
      panel?.destroy()
    },
  }
}

export { setupDevtools }
export type { SetupDevtoolsResult }
