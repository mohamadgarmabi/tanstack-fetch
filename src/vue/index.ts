import { createFetchPlugin, provideFetchClient } from './fetch-plugin'
import { fetchClientKey } from './fetch-key'
import { useFetch } from './use-fetch.composable'
import { useSse } from './use-sse.composable'
import type { CreateFetchPluginOptions, HttpFetchClient } from './fetch-plugin.type'
import type { UseSseOptions, UseSseResult } from './use-sse.composable'
import type { SseStatus } from 'tanstack-fetch'

export { createFetchPlugin, fetchClientKey, provideFetchClient, useFetch, useSse }
export type { CreateFetchPluginOptions, HttpFetchClient, SseStatus, UseSseOptions, UseSseResult }
