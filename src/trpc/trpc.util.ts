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
  try {
    return new URL(href)
  } catch {
    const origin =
      baseUrl && /^https?:\/\//i.test(baseUrl)
        ? baseUrl
        : typeof globalThis.location !== 'undefined'
          ? globalThis.location.origin
          : 'http://localhost'
    return new URL(href, origin)
  }
}

export { resolveIncomingHeaders, toAbsoluteUrl }
