import type { MigrateFinding, MigrateSource } from '../migrate.type'

const AXIOS_IMPORT_RE =
  /^(\s*)import\s+(?:axios(\s*,\s*\{([^}]*)\})?|(\{([^}]*)\})\s*)\s*from\s*['"]axios['"]\s*;?\s*$/gm

const detect = (source: string) =>
  /from\s*['"]axios['"]/.test(source) ||
  /\brequire\s*\(\s*['"]axios['"]\s*\)/.test(source) ||
  /\baxios\./.test(source)

const rewriteAxiosImports = (source: string): string =>
  source.replace(
    AXIOS_IMPORT_RE,
    (_full, indent: string, _defaultWithNamed, namedFromDefault, _namedOnly, namedOnlyBody) => {
      const namedSource = namedFromDefault ?? namedOnlyBody ?? ''
      const names = namedSource
        .split(',')
        .map((part: string) => part.trim())
        .filter(Boolean)
        .map((part: string) => {
          if (part === 'AxiosError' || part.startsWith('AxiosError ')) return 'FetchError'
          if (part === 'isAxiosError' || part.startsWith('isAxiosError ')) {
            return part.replace('isAxiosError', 'isFetchError')
          }
          return null
        })
        .filter((part: string | null): part is string => Boolean(part))

      const unique = [...new Set(['createFetch', ...names])]
      return `${indent}import { ${unique.join(', ')} } from 'tanstack-fetch'`
    },
  )

const applySafeTransforms = (source: string): string => {
  let next = rewriteAxiosImports(source)
  next = next.replace(/\baxios\.create\s*\(/g, 'createFetch(')
  next = next.replace(/\bbaseURL\s*:/g, 'baseUrl:')
  next = next.replace(/\bisAxiosError\s*\(/g, 'isFetchError(')
  next = next.replace(/\bAxiosError\b/g, 'FetchError')
  next = next.replace(/\baxios\.(get|post|put|patch|delete|request|head|options)\s*\(/g, 'api.$1(')
  return next
}

const collectFindings = (file: string, source: string): MigrateFinding[] => {
  const findings: MigrateFinding[] = []
  source.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) return

    if (/from\s*['"]axios['"]/.test(line) || /require\s*\(\s*['"]axios['"]/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'import',
        snippet: trimmed,
        note: 'Replace axios import with createFetch / isFetchError from tanstack-fetch',
      })
    }
    if (/\baxios\.create\s*\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'create',
        snippet: trimmed,
        note: 'axios.create({ baseURL }) → createFetch({ baseUrl })',
      })
    }
    if (/\baxios\.(get|post|put|patch|delete|request)\s*\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'call',
        snippet: trimmed,
        note: 'Use api.get/post/…; response is data (no .data); pass Query signal',
      })
    }
    if (/response\.data|\.data\b/.test(line) && /axios|await/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'data',
        snippet: trimmed,
        note: 'tanstack-fetch returns data directly — drop response.data',
      })
    }
    if (/\bparams\s*:/.test(line) && detect(source)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'query-params',
        snippet: trimmed,
        note: 'axios params (query string) → tanstack-fetch query: { … }',
      })
    }
    if (/isAxiosError|AxiosError/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'error',
        snippet: trimmed,
        note: 'AxiosError / isAxiosError → FetchError / isFetchError',
      })
    }
    if (/interceptors\.(request|response)/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'interceptor',
        snippet: trimmed,
        note: 'Map to getToken, plugins, or createRefreshTokenInterceptor',
      })
    }
  })
  return findings
}

const axiosSource: MigrateSource = {
  id: 'axios',
  detect,
  collectFindings,
  applySafeTransforms,
}

export { axiosSource }
