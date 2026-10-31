import { provide, type App, type Plugin } from 'vue'
// Providers accept every option shortcut (getToken, onUnauthorized, plugins, …).
import { createFetch } from 'tanstack-fetch/sse'
import type { CoreFetchClient, CreateFetchOptions } from 'tanstack-fetch'
import { fetchClientKey } from './fetch-key'
import type { AnyFetchClient, CreateFetchPluginOptions } from './fetch-plugin.type'

const buildClient = (options: CreateFetchPluginOptions): AnyFetchClient => {
  if (options.client) {
    return options.client as AnyFetchClient
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
const provideFetchClient = (client: AnyFetchClient | CoreFetchClient) => {
  provide(fetchClientKey, client as AnyFetchClient)
}

export { buildClient, createFetchPlugin, provideFetchClient }
