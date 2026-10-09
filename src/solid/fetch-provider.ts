import { createMemo, type ParentComponent } from 'solid-js'
import { createFetch } from 'tanstack-fetch'
import type { CreateFetchOptions } from 'tanstack-fetch'
import { FetchContext, type AnyFetchClient } from './fetch-context'
import type { FetchProviderProps } from './fetch-provider.type'

const FetchProvider: ParentComponent<FetchProviderProps> = (props) => {
  let cached: AnyFetchClient | undefined

  const value = createMemo(() => {
    if (props.client) return props.client
    if (!cached) {
      const { children: _children, client: _client, ...options } = props
      cached = createFetch(options as CreateFetchOptions)
    }
    return cached
  })

  // Solid Provider needs reactive getters without JSX (tsconfig is react-jsx).
  const providerProps = {} as { value: AnyFetchClient; children: typeof props.children }
  const readValue = () => value()
  const readChildren = () => props.children
  Object.defineProperty(providerProps, 'value', { enumerable: true, get: readValue })
  Object.defineProperty(providerProps, 'children', { enumerable: true, get: readChildren })

  return FetchContext.Provider(providerProps)
}

export default FetchProvider
