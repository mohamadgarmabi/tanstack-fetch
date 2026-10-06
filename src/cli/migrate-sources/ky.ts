import type { MigrateFinding, MigrateSource } from '../migrate.type'
import {
  collectHttpClientInstanceNames,
  ensureTanstackFetchImport,
  stripJsonChainOnCalls,
} from './migrate-source.util'

const detect = (source: string) =>
  /from\s*['"]ky['"]/.test(source) ||
  /\brequire\s*\(\s*['"]ky['"]\s*\)/.test(source) ||
  /\bky\.(create|get|post|put|patch|delete|extend|head)\s*\(/.test(source)

const applySafeTransforms = (source: string): string => {
  const instancesBefore = collectHttpClientInstanceNames(source)
  let next = source.replace(
    /^(\s*)import\s+ky(\s*,\s*\{[^}]*\})?\s*from\s*['"]ky['"]\s*;?\s*$/gm,
    `$1import { createFetch } from 'tanstack-fetch'`,
  )
  next = next.replace(
    /^(\s*)import\s+\{\s*([^}]*)\s*\}\s*from\s*['"]ky['"]\s*;?\s*$/gm,
    `$1import { createFetch } from 'tanstack-fetch'`,
  )
  next = next.replace(/\bky\.create\s*\(/g, 'createFetch(')
  next = next.replace(/\bky\.extend\s*\(/g, 'createFetch(')
  next = next.replace(/(createFetch\s*\(\s*\{[^}]*)\bprefixUrl\s*:/g, '$1baseUrl:')
  next = next.replace(/\bky\.(get|post|put|patch|delete|head)\s*\(/g, 'api.$1(')

  const instances = [
    ...new Set([...instancesBefore, ...collectHttpClientInstanceNames(next), 'api']),
  ]

  for (const name of instances) {
    next = next.replace(
      new RegExp(
        `(\\b${name}\\.(?:get|post|put|patch|delete|head)\\([^)]*)\\bsearchParams\\s*:`,
        'g',
      ),
      '$1query:',
    )
  }

  next = stripJsonChainOnCalls(next, instances)

  if (/\bapi\.(get|post|put|patch|delete|head)\s*\(/.test(next)) {
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

    if (/from\s*['"]ky['"]/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ky',
        kind: 'import',
        snippet: trimmed,
        note: 'Replace ky import with createFetch from tanstack-fetch',
      })
    }
    if (/\bky\.(create|extend)\s*\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ky',
        kind: 'create',
        snippet: trimmed,
        note: 'ky.create/extend({ prefixUrl }) → createFetch({ baseUrl })',
      })
    }
    if (/\bky\.(get|post|put|patch|delete|head)\s*\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ky',
        kind: 'call',
        snippet: trimmed,
        note: 'ky.get(url).json() → await api.get(url) (data returned directly)',
      })
    }
    for (const name of instances) {
      if (new RegExp(`\\b${name}\\.(get|post|put|patch|delete|head)\\s*\\(`).test(line)) {
        findings.push({
          file,
          line: lineNumber,
          source: 'ky',
          kind: 'call',
          snippet: trimmed,
          note: `${name}.get/post works after createFetch — drop .json(); searchParams → query`,
        })
      }
    }
    if (/\.json\s*\(\s*\)/.test(line) && /ky|api\.|\.get\(|\.post\(/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ky',
        kind: 'data',
        snippet: trimmed,
        note: 'Drop .json() — tanstack-fetch already parses JSON',
      })
    }
    if (/searchParams\s*:/.test(line) && detect(source)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ky',
        kind: 'query-params',
        snippet: trimmed,
        note: 'ky searchParams → tanstack-fetch query: { … }',
      })
    }
    if (/HTTPError|TimeoutError/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'ky',
        kind: 'error',
        snippet: trimmed,
        note: 'Use FetchError / isFetchError instead of ky HTTPError',
      })
    }
  })
  return findings
}

const kySource: MigrateSource = {
  id: 'ky',
  detect,
  collectFindings,
  applySafeTransforms,
}

export { kySource }
