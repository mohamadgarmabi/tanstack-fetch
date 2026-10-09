import { inject } from '@angular/core'
import { FETCH_CLIENT, type AnyFetchClient } from './fetch-token'

const injectFetch = (): AnyFetchClient => {
  const client = inject(FETCH_CLIENT, { optional: true })
  if (!client) {
    throw new Error(
      'tanstack-fetch: injectFetch() needs provideFetchClient() in providers, or pass { client } to useSse',
    )
  }
  return client
}

export { injectFetch }
