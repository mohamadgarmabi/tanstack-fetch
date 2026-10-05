import type { MigrateFinding, MigrateSource } from '../migrate.type'

const detect = (source: string) =>
  /from\s*['"]ofetch['"]/.test(source) ||
  /\brequire\s*\(\s*['"]ofetch['"]\s*\)/.test(source) ||
  /\b(?:ofetch|\$fetch)\s*(\.|create\s*\(|\()/m.test(source)

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
        ? 'createFetch, isFetchError'
        : 'createFetch'
      return `${indent}import { ${imports} } from 'tanstack-fetch'`
    },
  )
  next = next.replace(
    /^(\s*)import\s+ofetch(\s*,\s*\{[^}]*\})?\s*from\s*['"]ofetch['"]\s*;?\s*$/gm,
    `$1import { createFetch } from 'tanstack-fetch'`,
  )
  next = next.replace(/\bofetch\.create\s*\(/g, 'createFetch(')
  next = next.replace(/\bbaseURL\s*:/g, 'baseUrl:')
  // ofetch.get / $fetch.create patterns
  next = next.replace(/\bofetch\.(get|post|put|patch|delete|head)\s*\(/g, 'api.$1(')
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
    if (/\b\$fetch\s*\(/.test(line) || /\bofetch\s*\(/.test(line)) {
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
    if (/FetchError|createError/.test(line) && /ofetch|\$fetch/.test(source)) {
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
