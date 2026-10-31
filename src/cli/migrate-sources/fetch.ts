import type { MigrateFinding, MigrateSource } from '../migrate.type'
import { ensureTanstackFetchImport } from './migrate-source.util'

/** Native fetch — mostly report + limited safe rewrites (no default import to swap). */
const detect = (source: string) =>
  /\b(?:await|return|void)\s+fetch\s*\(/.test(source) ||
  /\bfetch\s*\([^;]*\)\s*\.then\b/.test(source) ||
  /(?:const|let|var)\s+\w+\s*=\s*await\s+fetch\s*\(/.test(source)

const applySafeTransforms = (source: string): string => {
  // ensureTanstackFetchImport is a no-op when tanstack-fetch is already imported
  return detect(source) ? ensureTanstackFetchImport(source) : source
}

const collectFindings = (file: string, source: string): MigrateFinding[] => {
  const findings: MigrateFinding[] = []
  source.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) return

    if (/\bfetch\s*\(/.test(line) && !/createFetch|from\s*['"]tanstack-fetch['"]/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'fetch',
        kind: 'call',
        snippet: trimmed,
        note: 'Replace raw fetch with api.get/post/… from a shared createFetch client',
      })
    }
    if (/\b(res|response)\.ok\b/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'fetch',
        kind: 'manual',
        snippet: trimmed,
        note: 'No res.ok checks needed — HTTP errors throw FetchError',
      })
    }
    if (/\.json\s*\(\s*\)/.test(line) && /fetch|response|res\b/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'fetch',
        kind: 'data',
        snippet: trimmed,
        note: 'Drop res.json() — tanstack-fetch returns parsed data',
      })
    }
    if (/new\s+Headers|headers:\s*\{[^}]*Authorization/.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        source: 'fetch',
        kind: 'manual',
        snippet: trimmed,
        note: 'Prefer createAuthInterceptor / headers on createFetch instead of manual Authorization',
      })
    }
  })
  return findings
}

const fetchSource: MigrateSource = {
  id: 'fetch',
  detect,
  collectFindings,
  applySafeTransforms,
}

export { fetchSource }
