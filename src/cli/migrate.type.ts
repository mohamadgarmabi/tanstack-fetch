import type { MigrateFramework } from './migrate-frameworks/migrate-framework.type'

type MigrateFrom = 'axios' | 'ky' | 'ofetch' | 'fetch' | 'all'

type MigrateArgs = {
  command: 'migrate'
  from: MigrateFrom
  dir: string
  write: boolean
  framework?: MigrateFramework
  /** React only: write FetchProvider scaffold. Default false (ask interactively when TTY). */
  provider?: boolean
  scaffold?: string | null
}

type MigrateFindingKind =
  | 'import'
  | 'create'
  | 'call'
  | 'error'
  | 'data'
  | 'query-params'
  | 'interceptor'
  | 'manual'

type MigrateFinding = {
  file: string
  line: number
  source: Exclude<MigrateFrom, 'all'>
  kind: MigrateFindingKind
  snippet: string
  note: string
}

type MigrateResult = {
  filesScanned: number
  filesChanged: number
  findings: MigrateFinding[]
  scaffoldWritten: string | null
  scaffoldsWritten: string[]
  frameworkTip: string | null
}

type MigrateSourceId = Exclude<MigrateFrom, 'all'>

type MigrateSource = {
  id: MigrateSourceId
  detect: (source: string) => boolean
  collectFindings: (file: string, source: string) => MigrateFinding[]
  applySafeTransforms: (source: string) => string
}

export type {
  MigrateArgs,
  MigrateFinding,
  MigrateFindingKind,
  MigrateFrom,
  MigrateFramework,
  MigrateResult,
  MigrateSource,
  MigrateSourceId,
}
