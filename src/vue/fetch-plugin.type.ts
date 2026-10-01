import type { CreateFetchOptions, FetchClient } from 'tanstack-fetch'

type HttpFetchClient = Omit<FetchClient, 'sse'>

type AnyFetchClient = FetchClient | HttpFetchClient

type CreateFetchPluginOptions = CreateFetchOptions & {
  client?: AnyFetchClient
}

export type { AnyFetchClient, CreateFetchPluginOptions, HttpFetchClient }
