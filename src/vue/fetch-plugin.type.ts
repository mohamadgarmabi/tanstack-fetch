import type { CoreFetchClient, CreateFetchOptions, FetchClient } from 'tanstack-fetch'

type HttpFetchClient = Omit<FetchClient, 'sse'>

type AnyFetchClient = FetchClient | HttpFetchClient

type CreateFetchPluginOptions = CreateFetchOptions & {
  client?: AnyFetchClient | CoreFetchClient
}

export type { AnyFetchClient, CreateFetchPluginOptions, HttpFetchClient }
