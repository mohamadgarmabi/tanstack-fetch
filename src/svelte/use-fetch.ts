import { getContextFetchClient } from './set-fetch-client'
import type { AnyFetchClient } from './fetch-context'

const useFetch = (): AnyFetchClient => {
  const client = getContextFetchClient()
  if (!client) {
    throw new Error(
      'tanstack-fetch: useFetch() needs setFetchClient() in a parent, or pass { client } to useSse',
    )
  }
  return client
}

export { useFetch }
