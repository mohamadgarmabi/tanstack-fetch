import type { PathParams, QueryParams } from '../types'

// `:name` is a param only at the start of a segment, so `/models/gemini:generateContent` stays literal.
const fillPath = (path: string, params?: PathParams) => {
  return path.replace(
    /(^|\/):([A-Za-z0-9_]+)|\{([A-Za-z0-9_]+)\}/g,
    (
      _match,
      slash: string | undefined,
      colonKey: string | undefined,
      braceKey: string | undefined,
    ) => {
      const key = (colonKey ?? braceKey) as string
      const value = params?.[key]
      if (value === undefined) {
        throw new Error(`tanstack-fetch: missing path param "${key}"`)
      }
      return (slash ?? '') + encodeURIComponent(String(value))
    },
  )
}

const appendQuery = (url: URL, query?: QueryParams) => {
  if (!query) {
    return
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)))
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
    throw new Error('tanstack-fetch: set an absolute baseUrl for SSR and Edge runtimes')
  }
}

// Only the pathname holds params: skip `scheme://host:port` and any `?query` / `#hash`.
const splitPath = (path: string) => {
  const origin = /^https?:\/\/[^/?#]*/i.exec(path)?.[0] ?? ''
  const rest = path.slice(origin.length)
  const suffixIndex = rest.search(/[?#]/)
  return suffixIndex === -1
    ? { origin, pathname: rest, suffix: '' }
    : { origin, pathname: rest.slice(0, suffixIndex), suffix: rest.slice(suffixIndex) }
}

const buildUrl = (
  baseUrl: string | undefined,
  path: string,
  params?: PathParams,
  query?: QueryParams,
) => {
  const { origin, pathname, suffix } = splitPath(path)
  const filledPath = origin + fillPath(pathname, params) + suffix
  const absolutePath = /^https?:\/\//i.test(filledPath)
    ? filledPath
    : `${(baseUrl ?? '').replace(/\/$/, '')}/${filledPath.replace(/^\//, '')}`
  const url = new URL(absolutePath)
  appendQuery(url, query)
  return url
}

export { buildUrl, assertAbsoluteUrl }
