import type { MigrateFinding, MigrateSource } from '../migrate.type'

/** Native fetch — mostly report + limited safe rewrites (no default import to swap). */
const detect = (source: string) =>
  /\bawait\s+fetch\s*\(/.test(source) ||
  /\breturn\s+fetch\s*\(/.test(source) ||
  /const\s+\w+\s*=\s*await\s+fetch\s*\(/.test(source)

const applySafeTransforms = (source: string): string => {
  // Only add createFetch import if file uses raw fetch and has no tanstack-fetch yet.
  if (!detect(source) || /from\s*['"]tanstack-fetch['"]/.test(source)) {
    return source
  }
  if (/^import\s/m.test(source)) {
    return source.replace(
      /^(import\s.+['"].+['"];?\s*\n)/m,
      `$1import { createFetch } from 'tanstack-fetch'\n`,
    )
  }
  return `import { createFetch } from 'tanstack-fetch'\n\n${source}`
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
    if (/!?\s*\w+\.ok\b/.test(line) || /\.ok\s*===/.test(line)) {
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
        note: 'Prefer getToken / headers on createFetch instead of manual Authorization',
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
