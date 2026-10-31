import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core'
// Providers accept every option shortcut (getToken, onUnauthorized, plugins, …).
import { createFetch } from 'tanstack-fetch/sse'
import type { CoreFetchClient, CreateFetchOptions } from 'tanstack-fetch'
import { FETCH_CLIENT, type AnyFetchClient } from './fetch-token'

type ProvideFetchOptions = CreateFetchOptions & {
  client?: AnyFetchClient | CoreFetchClient
}

const resolveClient = (options: ProvideFetchOptions = {}): AnyFetchClient => {
  if (options.client) return options.client as AnyFetchClient
  const { client: _client, ...createOptions } = options
  return createFetch(createOptions as CreateFetchOptions)
}

const provideFetchClient = (options: ProvideFetchOptions = {}): EnvironmentProviders => {
  const client = resolveClient(options)
  return makeEnvironmentProviders([{ provide: FETCH_CLIENT, useValue: client }])
}

export { provideFetchClient, resolveClient }
export type { ProvideFetchOptions }
