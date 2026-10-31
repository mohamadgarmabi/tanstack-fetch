import { createContext, useContext, useRef, type Context } from 'react'
// Providers accept every option shortcut (getToken, onUnauthorized, plugins, …).
import { createFetch } from 'tanstack-fetch/sse'
import type { CreateFetchOptions, FetchClient } from 'tanstack-fetch'
import type { FetchProviderProps, HttpFetchClient } from './fetch-provider.type'

type AnyFetchClient = FetchClient | HttpFetchClient

const FetchContext: Context<AnyFetchClient | null> = createContext<AnyFetchClient | null>(null)

const buildClient = (props: FetchProviderProps): AnyFetchClient => {
  if (props.client) {
    return props.client as AnyFetchClient
  }
  const { children: _children, client: _client, ...options } = props
  return createFetch(options as CreateFetchOptions)
}

const useFetchProviderState = (props: FetchProviderProps) => {
  const createdRef = useRef<AnyFetchClient | null>(null)

  if (props.client) {
    return { value: props.client as AnyFetchClient, children: props.children }
  }

  if (!createdRef.current) {
    createdRef.current = buildClient(props)
  }

  return { value: createdRef.current, children: props.children }
}

const useFetch = (): AnyFetchClient => {
  const client = useContext(FetchContext)
  if (!client) {
    throw new Error('tanstack-fetch: useFetch() must be used inside <FetchProvider>')
  }
  return client
}

export { FetchContext, useFetchProviderState, useFetch }
export type { AnyFetchClient }
