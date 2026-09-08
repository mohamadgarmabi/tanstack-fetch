import type {
  CreateClientOptions,
  HttpInterceptor,
  HttpMethod,
  IncomingHeaders,
  RequestContext,
  RequestOptions,
} from './types'
import { DEFAULT_MAX_RETRIES } from './constants'
import { assertAbsoluteUrl, buildUrl } from './utils/build-url'
import { mergeHeaders, resolveHeaders } from './utils/headers'

type SendSseArgs = {
  path: string
  requestOptions?: RequestOptions
  client: CreateClientOptions
  interceptors: HttpInterceptor[]
}

const resolveIncoming = async (
  client: CreateClientOptions,
): Promise<IncomingHeaders | undefined> => {
  if (!client.incoming) {
    return undefined
  }
  return typeof client.incoming === 'function' ? client.incoming() : client.incoming
}

const createSseContext = async (
  args: SendSseArgs,
  attempt: number,
  lastEventId?: string,
): Promise<RequestContext> => {
  const source = args.client.source ?? 'browser'
  assertAbsoluteUrl(args.client.baseUrl, source)
  const url = buildUrl(
    args.client.baseUrl,
    args.path,
    args.requestOptions?.params,
    args.requestOptions?.query,
  )
  const headers = mergeHeaders(
    await resolveHeaders(args.client.headers),
    args.requestOptions?.headers,
  )
  headers.set('accept', 'text/event-stream')
  if (lastEventId) {
    headers.set('last-event-id', lastEventId)
  }
  return {
    request: {
      method: 'GET' as HttpMethod,
      url,
      headers,
      body: args.requestOptions?.body,
      signal: args.requestOptions?.signal,
    },
    incoming: await resolveIncoming(args.client),
    meta: {
      attempt,
      maxRetries: args.client.maxRetries ?? DEFAULT_MAX_RETRIES,
      source,
      operation: args.requestOptions?.operation,
      lastEventId,
    },
  }
}

export { createSseContext }
export type { SendSseArgs }
