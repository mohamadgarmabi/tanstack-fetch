type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

type ClientSource = 'browser' | 'ssr' | 'edge'

type IncomingHeaders = {
  cookie?: string
  authorization?: string
  requestId?: string
}

type PathParams = Record<string, string | number>

type QueryParams = Record<string, string | number | boolean | undefined | null>

type PluginName = 'trace' | 'ssr-forward' | 'retry-idempotent' | 'sse-resume'

type MaybePromise<T> = T | Promise<T>

export type {
  HttpMethod,
  ClientSource,
  IncomingHeaders,
  PathParams,
  QueryParams,
  PluginName,
  MaybePromise,
}
