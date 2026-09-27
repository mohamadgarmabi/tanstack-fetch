import { createDevtoolsInterceptor } from './create-devtools-interceptor'
import { createDevtoolsStore } from './devtools.store'
import type { CreateDevtoolsOptions, CreateDevtoolsResult } from './devtools.type'

const createDevtools = (options: CreateDevtoolsOptions = {}): CreateDevtoolsResult => {
  const store = createDevtoolsStore(options)
  const interceptor = createDevtoolsInterceptor(store, {
    redactHeaders: options.redactHeaders,
    maxSseEvents: options.maxSseEvents,
  })

  return {
    store,
    interceptor,
    setFlags: (flags) => store.setFlags(flags),
  }
}

export { createDevtools }
