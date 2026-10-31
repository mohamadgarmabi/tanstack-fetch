import { clearFetchClient, getFetchClient } from './fetch-context'
import { setFetchClient } from './set-fetch-client'
import { useFetch } from './use-fetch'
import { useSse } from './use-sse'
import type { SetFetchClientOptions } from './set-fetch-client'
import type { UseSseOptions, UseSseResult } from './use-sse'
import { useWs } from './use-ws'
import type { UseWsOptions, UseWsResult } from './use-ws'
import type { SseStatus, WsStatus } from 'tanstack-fetch'

export { clearFetchClient, getFetchClient, setFetchClient, useFetch, useSse, useWs }
export type {
  SetFetchClientOptions,
  UseSseOptions,
  UseSseResult,
  SseStatus,
  WsStatus,
  UseWsOptions,
  UseWsResult,
}
