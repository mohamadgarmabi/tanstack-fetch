import type { MigrateFinding, MigrateSource } from '../migrate.type'
import {
  collectHttpClientInstanceNames,
  ensureTanstackFetchImport,
  stripJsonChainOnCalls,
} from './migrate-source.util'

const AXIOS_IMPORT_RE =
  /^(\s*)import\s+(?:axios(\s*,\s*\{([^}]*)\})?|(\{([^}]*)\})\s*)\s*from\s*['"]axios['"]\s*;?\s*$/gm

const HTTP_METHODS = 'get|post|put|patch|delete|request|head|options'

const detect = (source: string) =>
  /from\s*['"]axios['"]/.test(source) ||
  /\brequire\s*\(\s*['"]axios['"]\s*\)/.test(source) ||
  /\baxios\s*[.(]/.test(source)

const rewriteAxiosImports = (source: string): string => {
  let next = source.replace(
    AXIOS_IMPORT_RE,
    (_full, indent: string, _defaultWithNamed, namedFromDefault, _namedOnly, namedOnlyBody) => {
      const namedSource = namedFromDefault ?? namedOnlyBody ?? ''
      const names = namedSource
        .split(',')
        .map((part: string) => part.trim())
        .filter(Boolean)
        .map((part: string) => {
          if (part === 'AxiosError' || part.startsWith('AxiosError ')) {
            return part.replace('AxiosError', 'FetchError')
          }
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

  next = next.replace(
    /^(\s*)import\s+\*\s+as\s+axios\s+from\s*['"]axios['"]\s*;?\s*$/gm,
    `$1import { createFetch } from 'tanstack-fetch'`,
  )

  next = next.replace(
    /(?:const|let|var)\s+axios\s*=\s*require\s*\(\s*['"]axios['"]\s*\)\s*;?/g,
    `const { createFetch } = require('tanstack-fetch')`,
  )

  return next
}

const applySafeTransforms = (source: string): string => {
  const instancesBefore = collectHttpClientInstanceNames(source)
  let next = rewriteAxiosImports(source)
  next = next.replace(/\baxios\.create\s*\(/g, 'createFetch(')
  next = next.replace(/(createFetch\s*\(\s*\{[^}]*)\bbaseURL\s*:/g, '$1baseUrl:')
  next = next.replace(/\bisAxiosError\s*\(/g, 'isFetchError(')
  next = next.replace(/\bAxiosError\b/g, 'FetchError')

  // axios('/url') shorthand → api.get('/url')
  next = next.replace(/\baxios\s*\(\s*(['"`][^'"`]*['"`])\s*\)/g, 'api.get($1)')

  next = next.replace(new RegExp(`\\baxios\\.(${HTTP_METHODS})\\s*\\(`, 'g'), 'api.$1(')

  // (await api.get(...)).data → await api.get(...)
  next = next.replace(
    new RegExp(`\\(await\\s+api\\.(${HTTP_METHODS})\\(([^)]*)\\)\\)\\.data\\b`, 'g'),
    'await api.$1($2)',
  )

  const instances = [
    ...new Set([...instancesBefore, ...collectHttpClientInstanceNames(next), 'api']),
  ]

  for (const name of instances) {
    next = next.replace(
      new RegExp(`(\\b${name}\\.(?:${HTTP_METHODS})\\([^)]*)\\bparams\\s*:`, 'g'),
      '$1query:',
    )
  }

  next = stripJsonChainOnCalls(next, instances)

  if (/\bapi\.(get|post|put|patch|delete|request|head|options)\s*\(/.test(next)) {
    next = ensureTanstackFetchImport(next)
  }

  return next
}

const collectFindings = (file: string, source: string): MigrateFinding[] => {
  const findings: MigrateFinding[] = []
  const instances = collectHttpClientInstanceNames(source)

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
    if (
      new RegExp(`\\baxios\\.(${HTTP_METHODS})\\s*\\(`).test(line) ||
      /\baxios\s*\(\s*['"`]/.test(line) ||
      /\baxios\s*\(\s*\{/.test(line)
    ) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'call',
        snippet: trimmed,
        note: 'Use api.get/post/…; response is data (no .data); pass Query signal. axios({ url, method }) → api[method](url, options)',
      })
    }
    for (const name of instances) {
      if (new RegExp(`\\b${name}\\.(${HTTP_METHODS})\\s*\\(`).test(line)) {
        findings.push({
          file,
          line: lineNumber,
          source: 'axios',
          kind: 'call',
          snippet: trimmed,
          note: `${name}.get/post already works after createFetch — drop .data unwrap; pass signal`,
        })
      }
    }
    if ((/\.data\b/.test(line) || /\{\s*data\s*\}/.test(line)) && /axios|api\.|await/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'data',
        snippet: trimmed,
        note: 'tanstack-fetch returns data directly — drop response.data / { data } unwrap',
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
    if (/\baxios\.defaults\b/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'axios',
        kind: 'manual',
        snippet: trimmed,
        note: 'axios.defaults → createFetch({ baseUrl, headers, getToken, plugins })',
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
