import type { PathParams, QueryParams } from '../types'

const fillPath = (path: string, params?: PathParams) => {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params?.[key]
    if (value === undefined) {
      throw new Error(`typed-ssr-http: missing path param "${key}"`)
    }
    return encodeURIComponent(String(value))
  })
}

const appendQuery = (url: URL, query?: QueryParams) => {
  if (!query) {
    return
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }
    url.searchParams.set(key, String(value))
  })
}

const assertAbsoluteUrl = (baseUrl: string | undefined, source: string | undefined) => {
  if (source === 'browser' || !baseUrl) {
    return
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error('typed-ssr-http: set an absolute baseUrl for SSR and Edge runtimes')
  }
}

const buildUrl = (
  baseUrl: string | undefined,
  path: string,
  params?: PathParams,
  query?: QueryParams,
) => {
  const filledPath = fillPath(path.replace(/\{([A-Za-z0-9_]+)\}/g, ':$1'), params)
  const absolutePath = /^https?:\/\//i.test(filledPath)
    ? filledPath
    : `${(baseUrl ?? '').replace(/\/$/, '')}/${filledPath.replace(/^\//, '')}`
  const url = new URL(absolutePath)
  appendQuery(url, query)
  return url
}

export { buildUrl, assertAbsoluteUrl }
