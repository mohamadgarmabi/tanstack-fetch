import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { listSourceFiles, toRelativePath } from './list-source-files'
import type { DoctorArgs, DoctorFinding, DoctorResult } from './doctor.type'

const LEGACY_PACKAGES = ['axios', 'ky', 'ofetch'] as const

const FRAMEWORK_HINTS = [
  { id: 'react', packages: ['react', '@tanstack/react-query'] },
  { id: 'vue', packages: ['vue', '@tanstack/vue-query'] },
  { id: 'nuxt', packages: ['nuxt'] },
  { id: 'nextjs', packages: ['next'] },
  { id: 'solid', packages: ['solid-js', '@tanstack/solid-query'] },
  { id: 'angular', packages: ['@angular/core', '@tanstack/angular-query-experimental'] },
  { id: 'svelte', packages: ['svelte', '@tanstack/svelte-query'] },
  { id: 'sveltekit', packages: ['@sveltejs/kit'] },
] as const

const CREATE_FETCH_RE = /\bcreateFetch\s*\(/g
const LEGACY_IMPORT_RE =
  /from\s*['"](?:axios|ky|ofetch)['"]|\brequire\s*\(\s*['"](?:axios|ky|ofetch)['"]\s*\)|\$fetch\s*[<(]/
const QUERY_FN_BLOCK_RE =
  /queryFn\s*:\s*(?:async\s*)?\(([^)]*)\)\s*(?:=>|{)[\s\S]{0,800}?(?=queryFn\s*:|mutationFn\s*:|$)/g
const API_CALL_RE = /\b(?:api|client)\.(?:get|post|put|patch|delete|request|upload|sse)\s*\(/g

const readPackageJson = (rootDirectory: string): Record<string, unknown> | null => {
  const path = join(rootDirectory, 'package.json')
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

const dependencyNames = (pkg: Record<string, unknown> | null): Set<string> => {
  const names = new Set<string>()
  if (!pkg) return names
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const block = pkg[field]
    if (!block || typeof block !== 'object') continue
    for (const name of Object.keys(block as Record<string, string>)) {
      names.add(name)
    }
  }
  return names
}

const countMatches = (source: string, pattern: RegExp) => {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const globalPattern = new RegExp(pattern.source, flags)
  return [...source.matchAll(globalPattern)].length
}

const collectMissingSignalHits = (source: string, file: string): DoctorFinding[] => {
  const findings: DoctorFinding[] = []
  for (const match of source.matchAll(QUERY_FN_BLOCK_RE)) {
    const params = match[1] ?? ''
    const body = match[0] ?? ''
    if (!API_CALL_RE.test(body)) continue
    API_CALL_RE.lastIndex = 0
    const hasSignalParam = /\bsignal\b/.test(params)
    const passesSignal = /\{[^}]*\bsignal\b/.test(body)
    if (hasSignalParam && passesSignal) continue
    if (!hasSignalParam && !passesSignal) {
      findings.push({
        severity: 'warn',
        code: 'missing-signal',
        message: `${file}: queryFn calls api.* without AbortSignal — pass { signal } from Query`,
      })
    }
  }
  return findings
}

const runDoctorChecks = (rootDirectory: string): DoctorResult => {
  const findings: DoctorFinding[] = []
  const pkg = readPackageJson(rootDirectory)
  const deps = dependencyNames(pkg)

  if (!pkg) {
    findings.push({
      severity: 'warn',
      code: 'no-package-json',
      message: 'No package.json in --dir (dependency checks skipped)',
    })
  } else if (deps.has('tanstack-fetch')) {
    findings.push({
      severity: 'ok',
      code: 'has-tanstack-fetch',
      message: 'tanstack-fetch is listed in package.json',
    })
  } else {
    findings.push({
      severity: 'info',
      code: 'missing-tanstack-fetch',
      message: 'tanstack-fetch not in package.json — npm install tanstack-fetch',
    })
  }

  const legacyInstalled = LEGACY_PACKAGES.filter((name) => deps.has(name))
  if (legacyInstalled.length > 0) {
    findings.push({
      severity: 'info',
      code: 'legacy-deps',
      message: `Legacy HTTP clients in package.json: ${legacyInstalled.join(', ')} — try npx tanstack-fetch migrate --from all`,
    })
  }

  const frameworks = FRAMEWORK_HINTS.filter((hint) =>
    hint.packages.some((name) => deps.has(name)),
  ).map((hint) => hint.id)
  if (frameworks.length > 0) {
    findings.push({
      severity: 'ok',
      code: 'frameworks',
      message: `Detected stack: ${frameworks.join(', ')} — migrate --framework ${frameworks[0]}`,
    })
  }

  const files = listSourceFiles(rootDirectory)
  let createFetchHits = 0
  let legacyImportFiles = 0

  for (const absolutePath of files) {
    const source = readFileSync(absolutePath, 'utf8')
    const relativeFile = toRelativePath(rootDirectory, absolutePath)
    createFetchHits += countMatches(source, CREATE_FETCH_RE)
    if (LEGACY_IMPORT_RE.test(source)) {
      legacyImportFiles += 1
      LEGACY_IMPORT_RE.lastIndex = 0
    }
    findings.push(...collectMissingSignalHits(source, relativeFile))
  }

  if (createFetchHits === 0) {
    findings.push({
      severity: 'info',
      code: 'no-create-fetch',
      message: 'No createFetch(…) call sites found — scaffold with migrate --framework … --write',
    })
  } else {
    findings.push({
      severity: 'ok',
      code: 'create-fetch-count',
      message: `Found ${createFetchHits} createFetch(…) call site(s)`,
    })
  }

  if (legacyImportFiles > 0) {
    findings.push({
      severity: 'warn',
      code: 'legacy-imports',
      message: `${legacyImportFiles} file(s) still import axios / ky / ofetch / $fetch`,
    })
  }

  const hasWarn = findings.some((item) => item.severity === 'warn')
  return {
    findings,
    filesScanned: files.length,
    exitCode: hasWarn ? 1 : 0,
  }
}

const formatDoctorReport = (result: DoctorResult, dir: string) => {
  const lines = [
    `tanstack-fetch doctor --dir ${dir}`,
    `Scanned ${result.filesScanned} files · ${result.findings.length} checks`,
    '',
  ]

  for (const finding of result.findings) {
    const tag = finding.severity.toUpperCase().padEnd(4)
    lines.push(`[${tag}] ${finding.code}`)
    lines.push(`  ${finding.message}`)
    lines.push('')
  }

  lines.push(
    result.exitCode === 0
      ? 'Doctor finished with no warnings.'
      : 'Doctor finished with warnings (exit 1).',
  )
  lines.push('Guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate')
  return lines.join('\n')
}

const doctor = (args: DoctorArgs): DoctorResult => {
  const rootDirectory = resolve(args.dir)
  if (!existsSync(rootDirectory)) {
    throw new Error(`tanstack-fetch: directory not found: ${args.dir}`)
  }
  return runDoctorChecks(rootDirectory)
}

const runDoctor = async (args: DoctorArgs) => {
  const result = doctor(args)
  console.log(formatDoctorReport(result, args.dir))
  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode
  }
  return result
}

export { doctor, formatDoctorReport, runDoctor }
