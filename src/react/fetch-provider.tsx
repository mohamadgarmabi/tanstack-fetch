import { createElement } from 'react'
import type { FetchProviderProps } from './fetch-provider.type'
import { FetchContext, useFetchProviderState } from './fetch-provider.hook'

const FetchProvider = (props: FetchProviderProps) => {
  const { value, children } = useFetchProviderState(props)
  return createElement(FetchContext.Provider, { value }, children)
}

export default FetchProvider
export type { FetchProviderProps }
