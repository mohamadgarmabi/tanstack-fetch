import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core'
import { createFetch } from 'tanstack-fetch'
import type { CreateFetchOptions } from 'tanstack-fetch'
import { FETCH_CLIENT, type AnyFetchClient } from './fetch-token'

type ProvideFetchOptions = CreateFetchOptions & {
  client?: AnyFetchClient
}

const resolveClient = (options: ProvideFetchOptions = {}): AnyFetchClient => {
  if (options.client) return options.client
  const { client: _client, ...createOptions } = options
  return createFetch(createOptions as CreateFetchOptions)
}

const provideFetchClient = (options: ProvideFetchOptions = {}): EnvironmentProviders => {
  const client = resolveClient(options)
  return makeEnvironmentProviders([{ provide: FETCH_CLIENT, useValue: client }])
}

export { provideFetchClient, resolveClient }
export type { ProvideFetchOptions }
