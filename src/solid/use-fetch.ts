import { useContext } from 'solid-js'
import { FetchContext, type AnyFetchClient } from './fetch-context'

const useFetch = (): AnyFetchClient => {
  const client = useContext(FetchContext)
  if (!client) {
    throw new Error(
      'tanstack-fetch: useFetch() must be used inside <FetchProvider>, or pass { client } to useSse',
    )
  }
  return client
}

export { useFetch }
