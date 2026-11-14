import { buildUrl } from '../utils/build-url'
import type { CreateFetchOptions, IncomingHeaders } from '../types'

const resolveIncomingHeaders = async (
  options: CreateFetchOptions,
): Promise<IncomingHeaders | undefined> => {
  if (!options.incoming) {
    return undefined
  }
  return typeof options.incoming === 'function' ? options.incoming() : options.incoming
}

const toAbsoluteUrl = (href: string, baseUrl?: string) => {
  if (/^https?:\/\//i.test(href)) {
    return new URL(href)
  }
  // Join like core requests so a base path survives: `https://api.x.com/v1` + `/trpc` → `/v1/trpc`.
  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    return buildUrl(baseUrl, href)
  }
  if (typeof globalThis.location !== 'undefined') {
    return new URL(href, globalThis.location.origin)
  }
  throw new Error(
    `tanstack-fetch: tRPC url "${href}" is relative; set an absolute baseUrl or link url for SSR and Edge runtimes`,
  )
}

export { resolveIncomingHeaders, toAbsoluteUrl }
