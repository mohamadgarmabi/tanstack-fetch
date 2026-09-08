import { useRef } from 'react'
import { createFetch } from '../create-fetch'
import type { CreateFetchOptions, FetchClient } from '../types'
import type { FetchProviderProps } from './fetch-provider.type'
import { createContext, useContext, type Context } from 'react'

const FetchContext: Context<FetchClient | null> = createContext<FetchClient | null>(null)

const buildClient = (props: FetchProviderProps): FetchClient => {
  if (props.client) {
    return props.client
  }
  const { children: _children, client: _client, ...options } = props
  return createFetch(options as CreateFetchOptions)
}

const useFetchProviderState = (props: FetchProviderProps) => {
  const createdRef = useRef<FetchClient | null>(null)

  if (props.client) {
    return { value: props.client, children: props.children }
  }

  if (!createdRef.current) {
    createdRef.current = buildClient(props)
  }

  return { value: createdRef.current, children: props.children }
}

const useFetch = (): FetchClient => {
  const client = useContext(FetchContext)
  if (!client) {
    throw new Error('tanstack-fetch: useFetch() must be used inside <FetchProvider>')
  }
  return client
}

export { FetchContext, useFetchProviderState, useFetch }
