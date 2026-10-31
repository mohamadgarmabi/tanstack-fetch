import { createFetchPlugin, provideFetchClient } from './fetch-plugin'
import { fetchClientKey } from './fetch-key'
import { useFetch } from './use-fetch.composable'
import { useSse } from './use-sse.composable'
import type { CreateFetchPluginOptions, HttpFetchClient } from './fetch-plugin.type'
import type { UseSseOptions, UseSseResult } from './use-sse.composable'
import { useWs } from './use-ws.composable'
import type { UseWsOptions, UseWsResult } from './use-ws.composable'
import type { SseStatus, WsStatus } from 'tanstack-fetch'

export { createFetchPlugin, fetchClientKey, provideFetchClient, useFetch, useSse, useWs }
export type {
  CreateFetchPluginOptions,
  HttpFetchClient,
  SseStatus,
  WsStatus,
  UseWsOptions,
  UseWsResult,
  UseSseOptions,
  UseSseResult,
}
