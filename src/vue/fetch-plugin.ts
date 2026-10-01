import { provide, type App, type Plugin } from 'vue'
import { createFetch } from 'tanstack-fetch'
import type { CreateFetchOptions } from 'tanstack-fetch'
import { fetchClientKey } from './fetch-key'
import type { AnyFetchClient, CreateFetchPluginOptions } from './fetch-plugin.type'

const buildClient = (options: CreateFetchPluginOptions): AnyFetchClient => {
  if (options.client) {
    return options.client
  }
  const { client: _client, ...createOptions } = options
  return createFetch(createOptions as CreateFetchOptions)
}

const createFetchPlugin = (options: CreateFetchPluginOptions = {}): Plugin => {
  const client = buildClient(options)
  return {
    install: (app: App) => {
      app.provide(fetchClientKey, client)
    },
  }
}

/** Provide the client in a parent `setup()` / Nuxt plugin so child components can `useFetch()`. */
const provideFetchClient = (client: AnyFetchClient) => {
  provide(fetchClientKey, client)
}

export { buildClient, createFetchPlugin, provideFetchClient }
