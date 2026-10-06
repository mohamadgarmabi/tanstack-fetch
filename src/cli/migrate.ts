import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { listSourceFiles, toRelativePath } from './list-source-files'
import { resolveFrameworkScaffold } from './migrate-frameworks'
import type { MigrateArgs, MigrateFinding, MigrateResult } from './migrate.type'
import { resolveMigrateSources } from './migrate-sources'
import { promptReactProvider } from './prompt-react-provider'

const isPathInsideRoot = (rootDirectory: string, absolutePath: string) => {
  const relativePath = relative(rootDirectory, absolutePath)
  return relativePath === '' || !relativePath.startsWith('..')
}

const isMigrateSelfPath = (absolutePath: string) => {
  const normalized = absolutePath.split('\\').join('/')
  return normalized.includes('/cli/migrate')
}

const DEFAULT_SCAFFOLD = 'src/lib/api.ts'

const GENERIC_SCAFFOLD = `import { createFetch, isFetchError } from 'tanstack-fetch'

/**
 * Shared client for TanStack Query queryFn.
 * Returns data, throws FetchError, honors AbortSignal — no response.data unwrap.
 */
export const api = createFetch({
  baseUrl: process.env.API_URL ?? process.env.VITE_API_URL ?? 'https://api.example.com',
  getToken: () =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem('access_token'),
  plugins: ['trace', 'retry-idempotent'],
})

export { isFetchError }
`

const formatReport = (result: MigrateResult, write: boolean, from: string, framework?: string) => {
  const frameworkLabel = framework ? ` --framework ${framework}` : ''
  const lines = [
    `tanstack-fetch migrate --from ${from}${frameworkLabel}`,
    `Scanned ${result.filesScanned} files · ${result.findings.length} findings · ${result.filesChanged} written`,
    '',
  ]

  if (result.scaffoldsWritten.length > 0) {
    lines.push('Scaffold:')
    for (const path of result.scaffoldsWritten) {
      lines.push(`  - ${path}`)
    }
    lines.push('')
  } else if (result.scaffoldWritten) {
    lines.push(`Scaffold: ${result.scaffoldWritten}`, '')
  }

  if (result.frameworkTip) {
    lines.push(`Framework tip: ${result.frameworkTip}`, '')
  }

  if (result.findings.length === 0) {
    lines.push(`No ${from === 'all' ? 'axios/ky/ofetch/fetch' : from} usage found.`)
    return lines.join('\n')
  }

  for (const finding of result.findings) {
    lines.push(`${finding.file}:${finding.line} [${finding.source}/${finding.kind}]`)
    lines.push(`  ${finding.snippet}`)
    lines.push(`  → ${finding.note}`)
    lines.push('')
  }

  lines.push(
    write
      ? 'Safe transforms applied. Review manual findings (query params, res.ok, interceptors) yourself.'
      : 'Dry run only. Re-run with --write to apply safe transforms.',
  )
  lines.push('Guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate')
  return lines.join('\n')
}

const writeScaffoldFile = (rootDirectory: string, relativePath: string, contents: string) => {
  const absolutePath = resolve(rootDirectory, relativePath)
  if (!isPathInsideRoot(rootDirectory, absolutePath)) {
    throw new Error(`tanstack-fetch: scaffold path escapes directory: ${relativePath}`)
  }
  if (existsSync(absolutePath)) return null
  mkdirSync(dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, contents, 'utf8')
  return toRelativePath(rootDirectory, absolutePath)
}

const migrate = (args: MigrateArgs): MigrateResult => {
  const rootDirectory = resolve(args.dir)
  if (!existsSync(rootDirectory)) {
    throw new Error(`tanstack-fetch: directory not found: ${args.dir}`)
  }

  const sources = resolveMigrateSources(args.from)
  const findings: MigrateFinding[] = []
  let filesChanged = 0
  const files = listSourceFiles(rootDirectory)

  for (const absolutePath of files) {
    if (isMigrateSelfPath(absolutePath)) continue
    const sourceText = readFileSync(absolutePath, 'utf8')
    const relativeFile = toRelativePath(rootDirectory, absolutePath)
    const matched = sources.filter((item) => item.detect(sourceText))
    if (matched.length === 0) continue

    for (const item of matched) {
      findings.push(...item.collectFindings(relativeFile, sourceText))
    }

    if (!args.write) continue

    let next = sourceText
    for (const item of matched) {
      next = item.applySafeTransforms(next)
    }
    if (next !== sourceText) {
      writeFileSync(absolutePath, next, 'utf8')
      filesChanged += 1
    }
  }

  const scaffoldsWritten: string[] = []
  let scaffoldWritten: string | null = null
  let frameworkTip: string | null = null
  const shouldWriteScaffold = args.write && args.scaffold !== null

  if (shouldWriteScaffold && args.framework) {
    const scaffold = resolveFrameworkScaffold(args.framework, {
      provider: args.provider,
    })
    frameworkTip = scaffold.tip
    for (const file of scaffold.files) {
      const written = writeScaffoldFile(rootDirectory, file.path, file.contents)
      if (written) scaffoldsWritten.push(written)
    }
  } else if (shouldWriteScaffold) {
    const relativePath =
      typeof args.scaffold === 'string' ? args.scaffold : DEFAULT_SCAFFOLD
    const written = writeScaffoldFile(rootDirectory, relativePath, GENERIC_SCAFFOLD)
    scaffoldWritten = written
    if (written) scaffoldsWritten.push(written)
  }

  return {
    filesScanned: files.length,
    filesChanged,
    findings,
    scaffoldWritten,
    scaffoldsWritten,
    frameworkTip,
  }
}

const resolveMigrateArgs = async (args: MigrateArgs): Promise<MigrateArgs> => {
  if (!args.write || args.framework !== 'react' || args.provider !== undefined) {
    return args
  }
  const provider = await promptReactProvider()
  return { ...args, provider }
}

const runMigrate = async (args: MigrateArgs) => {
  const resolved = await resolveMigrateArgs(args)
  const result = migrate(resolved)
  console.log(formatReport(result, resolved.write, resolved.from, resolved.framework))
  return result
}

export { DEFAULT_SCAFFOLD, GENERIC_SCAFFOLD as SCAFFOLD_SOURCE, formatReport, migrate, runMigrate }
