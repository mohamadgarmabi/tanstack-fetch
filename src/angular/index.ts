import { FETCH_CLIENT } from './fetch-token'
import { injectFetch } from './inject-fetch'
import { provideFetchClient } from './provide-fetch'
import { useSse } from './use-sse'
import type { ProvideFetchOptions } from './provide-fetch'
import type { UseSseOptions, UseSseResult } from './use-sse'
import { useWs } from './use-ws'
import type { UseWsOptions, UseWsResult } from './use-ws'
import type { SseStatus, WsStatus } from 'tanstack-fetch'

export { FETCH_CLIENT, injectFetch, provideFetchClient, useSse, useWs }
export type {
  ProvideFetchOptions,
  UseSseOptions,
  UseSseResult,
  SseStatus,
  WsStatus,
  UseWsOptions,
  UseWsResult,
}
