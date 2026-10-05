import type { MigrateArgs, MigrateFrom } from './migrate.type'
import { parseMigrateFramework } from './migrate-frameworks'

type GenerateArgs = {
  command: 'generate'
  spec: string
  out: string
}

type CliArgs = GenerateArgs | MigrateArgs | { command: 'help' }

const MIGRATE_FROM_VALUES = new Set<MigrateFrom>(['axios', 'ky', 'ofetch', 'fetch', 'all'])

const readFlagValue = (rest: string[], index: number, key: string) => {
  const value = rest[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`tanstack-fetch: missing value for --${key}`)
  }
  return value
}

const parseMigrateFrom = (value: string): MigrateFrom => {
  if (!MIGRATE_FROM_VALUES.has(value as MigrateFrom)) {
    throw new Error(
      `tanstack-fetch: --from must be axios|ky|ofetch|fetch|all (got "${value}")`,
    )
  }
  return value as MigrateFrom
}

const parseArgs = (argv: string[]): CliArgs => {
  const [command, ...rest] = argv
  if (!command || command === '--help' || command === 'help' || command === '-h') {
    return { command: 'help' }
  }

  if (command === 'generate') {
    const flags = new Map<string, string>()
    for (let index = 0; index < rest.length; index += 1) {
      const token = rest[index]
      if (!token.startsWith('--')) continue
      const key = token.slice(2)
      flags.set(key, readFlagValue(rest, index, key))
      index += 1
    }
    const spec = flags.get('spec')
    const out = flags.get('out')
    if (!spec || !out) {
      throw new Error('tanstack-fetch: generate requires --spec and --out')
    }
    return { command: 'generate', spec, out }
  }

  if (command === 'migrate' || command === 'migrate-axios') {
    let from: MigrateFrom = command === 'migrate-axios' ? 'axios' : 'all'
    let dir = '.'
    let write = false
    let scaffold: string | null | undefined = undefined
    let framework: MigrateArgs['framework']
    let provider: boolean | undefined
    let fromSet = command === 'migrate-axios'

    for (let index = 0; index < rest.length; index += 1) {
      const token = rest[index]
      if (token === '--write') {
        write = true
        continue
      }
      if (token === '--from') {
        from = parseMigrateFrom(readFlagValue(rest, index, 'from'))
        fromSet = true
        index += 1
        continue
      }
      if (token === '--framework') {
        framework = parseMigrateFramework(readFlagValue(rest, index, 'framework'))
        index += 1
        continue
      }
      if (token === '--provider') {
        provider = true
        continue
      }
      if (token === '--no-provider') {
        provider = false
        continue
      }
      if (token === '--dir') {
        dir = readFlagValue(rest, index, 'dir')
        index += 1
        continue
      }
      if (token === '--scaffold') {
        scaffold = readFlagValue(rest, index, 'scaffold')
        index += 1
        continue
      }
      if (token === '--no-scaffold') {
        scaffold = null
        continue
      }
      if (token.startsWith('--')) {
        throw new Error(`tanstack-fetch: unknown flag "${token}"`)
      }
      dir = token
    }

    if (command === 'migrate' && !fromSet) {
      throw new Error(
        'tanstack-fetch: migrate requires --from axios|ky|ofetch|fetch|all',
      )
    }

    return { command: 'migrate', from, dir, write, scaffold, framework, provider }
  }

  throw new Error(`tanstack-fetch: unknown command "${command}"`)
}

const helpText = `tanstack-fetch

Usage:
  tanstack-fetch generate --spec ./openapi.json --out ./src/api
  tanstack-fetch migrate --from <axios|ky|ofetch|fetch|all> [--framework react|vue|nuxt|nextjs] [--dir ./src] [--write]
  tanstack-fetch migrate-axios [--framework react] [--dir ./src] [--write]

Commands:
  generate        Generate a typed client from an OpenAPI document
  migrate         Scan/rewrite axios / ky / ofetch / fetch (+ optional framework scaffold)
  migrate-axios   Alias for migrate --from axios

migrate flags:
  --from         axios | ky | ofetch | fetch | all
  --framework    react | vue | nuxt | nextjs  (scaffold provider/plugin/SSR files with --write)
  --provider     React: include FetchProvider scaffold (skips prompt)
  --no-provider  React: skip FetchProvider (default; skips prompt)
  --dir          Root directory to scan (default: .)
  --write        Apply safe transforms + write scaffold
  --scaffold     Custom path for generic api.ts (ignored when --framework is set)
  --no-scaffold  Skip scaffold files

Guide: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate
`

export { parseArgs, helpText }
export type { CliArgs, GenerateArgs }
