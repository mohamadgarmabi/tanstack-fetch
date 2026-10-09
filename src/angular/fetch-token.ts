import { InjectionToken } from '@angular/core'
import type { FetchClient } from 'tanstack-fetch'

type HttpFetchClient = Omit<FetchClient, 'sse'>
type AnyFetchClient = FetchClient | HttpFetchClient

const FETCH_CLIENT = new InjectionToken<AnyFetchClient>('tanstack-fetch:client')

export { FETCH_CLIENT }
export type { AnyFetchClient, HttpFetchClient }
