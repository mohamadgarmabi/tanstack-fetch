import type { MigrateFinding, MigrateSource } from '../migrate.type'
import { ensureTanstackFetchImport } from './migrate-source.util'

/** `$` is not a word char — do not use `\b` before `$fetch`. */
const DOLLAR_FETCH_RE = /(?<![\w$])\$fetch\b/
const OFETCH_OR_DOLLAR_CALL_RE = /(?<![\w$])(?:\$fetch|ofetch)\s*\(/

const detect = (source: string) =>
  /from\s*['"]ofetch['"]/.test(source) ||
  /\brequire\s*\(\s*['"]ofetch['"]\s*\)/.test(source) ||
  /\bofetch\s*(\.|create\s*\(|\()/m.test(source) ||
  DOLLAR_FETCH_RE.test(source)

const rewriteFetchCallsWithMethod = (source: string): string => {
  let next = source
  const methods = [
    ['GET', 'get'],
    ['POST', 'post'],
    ['PUT', 'put'],
    ['PATCH', 'patch'],
    ['DELETE', 'delete'],
    ['HEAD', 'head'],
  ] as const

  for (const [httpMethod, apiMethod] of methods) {
    const pattern = new RegExp(
      `(?<![\\w$])(?:\\$fetch|ofetch)\\s*\\(\\s*(['"\`][^'"\`]*['"\`])\\s*,\\s*\\{\\s*method\\s*:\\s*['"]${httpMethod}['"]\\s*,?\\s*`,
      'gi',
    )
    next = next.replace(pattern, `api.${apiMethod}($1, {`)
  }

  // single-arg GET: $fetch('/users') / ofetch('/users')
  next = next.replace(
    /(?<![\w$])(?:\$fetch|ofetch)\s*\(\s*(['"`][^'"`]*['"`])\s*\)/g,
    'api.get($1)',
  )

  // clean empty option bags: api.get('/x', { })
  next = next.replace(
    /(\bapi\.(?:get|post|put|patch|delete|head)\(\s*['"`][^'"`]*['"`])\s*,\s*\{\s*\}\s*\)/g,
    '$1)',
  )

  return next
}

const applySafeTransforms = (source: string): string => {
  let next = source.replace(
    /^(\s*)import\s+\{\s*([^}]*)\s*\}\s*from\s*['"]ofetch['"]\s*;?\s*$/gm,
    (_full, indent: string, named: string) => {
      const names = named
        .split(',')
        .map((part: string) => part.trim())
        .filter(Boolean)
      const wantsFetchError = names.some(
        (name) => name === 'FetchError' || name.startsWith('FetchError '),
      )
      const imports = wantsFetchError
        ? 'createFetch, FetchError, isFetchError'
        : 'createFetch'
      return `${indent}import { ${imports} } from 'tanstack-fetch'`
    },
  )
  next = next.replace(
    /^(\s*)import\s+ofetch(\s*,\s*\{[^}]*\})?\s*from\s*['"]ofetch['"]\s*;?\s*$/gm,
    `$1import { createFetch } from 'tanstack-fetch'`,
  )
  next = next.replace(/\bofetch\.create\s*\(/g, 'createFetch(')
  next = next.replace(/(createFetch\s*\(\s*\{[^}]*)\bbaseURL\s*:/g, '$1baseUrl:')
  next = next.replace(/\bofetch\.(get|post|put|patch|delete|head)\s*\(/g, 'api.$1(')
  next = rewriteFetchCallsWithMethod(next)

  if (/\bapi\.(get|post|put|patch|delete|head)\s*\(/.test(next)) {
    next = ensureTanstackFetchImport(next)
  }

  return next
}

const collectFindings = (file: string, source: string): MigrateFinding[] => {
  const findings: MigrateFinding[] = []
  source.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) return

    if (/from\s*['"]ofetch['"]/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ofetch',
        kind: 'import',
        snippet: trimmed,
        note: 'Replace ofetch / $fetch import with createFetch from tanstack-fetch',
      })
    }
    if (/\bofetch\.create\s*\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ofetch',
        kind: 'create',
        snippet: trimmed,
        note: 'ofetch.create({ baseURL }) → createFetch({ baseUrl })',
      })
    }
    if (OFETCH_OR_DOLLAR_CALL_RE.test(line) || /\bofetch\s*\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ofetch',
        kind: 'call',
        snippet: trimmed,
        note: '$fetch/ofetch(url, { method }) → api.get/post/…(url, options); pass signal',
      })
    }
    if (/\bofetch\.(get|post|put|patch|delete)\s*\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ofetch',
        kind: 'call',
        snippet: trimmed,
        note: 'ofetch.get/post → api.get/post',
      })
    }
    if (/\bquery\s*:/.test(line) && detect(source)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ofetch',
        kind: 'query-params',
        snippet: trimmed,
        note: 'ofetch query maps to tanstack-fetch query (same name); path params use params',
      })
    }
    if (
      /FetchError|createError/.test(line) &&
      (/ofetch/.test(source) || DOLLAR_FETCH_RE.test(source))
    ) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ofetch',
        kind: 'error',
        snippet: trimmed,
        note: 'Use tanstack-fetch FetchError / isFetchError',
      })
    }
  })
  return findings
}

const ofetchSource: MigrateSource = {
  id: 'ofetch',
  detect,
  collectFindings,
  applySafeTransforms,
}

export { ofetchSource }
