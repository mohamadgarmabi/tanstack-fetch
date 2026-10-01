import { inject } from 'vue'
import { fetchClientKey } from './fetch-key'
import type { AnyFetchClient } from './fetch-plugin.type'

const useFetch = (): AnyFetchClient => {
  const client = inject(fetchClientKey, null)
  if (!client) {
    throw new Error(
      'tanstack-fetch: useFetch() needs createFetchPlugin / provideFetchClient, or pass { client } to useSse',
    )
  }
  return client
}

export { useFetch }
