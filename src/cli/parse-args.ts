type GenerateArgs = {
  command: 'generate'
  spec: string
  out: string
}

type CliArgs = GenerateArgs | { command: 'help' }

const parseArgs = (argv: string[]): CliArgs => {
  const [command, ...rest] = argv
  if (!command || command === '--help' || command === 'help' || command === '-h') {
    return { command: 'help' }
  }
  if (command !== 'generate') {
    throw new Error(`typed-ssr-http: unknown command "${command}"`)
  }

  const flags = new Map<string, string>()
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (!token.startsWith('--')) {
      continue
    }
    const key = token.slice(2)
    const value = rest[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`typed-ssr-http: missing value for --${key}`)
    }
    flags.set(key, value)
    index += 1
  }

  const spec = flags.get('spec')
  const out = flags.get('out')
  if (!spec || !out) {
    throw new Error('typed-ssr-http: generate requires --spec and --out')
  }

  return { command: 'generate', spec, out }
}

const helpText = `typed-ssr-http

Usage:
  typed-ssr-http generate --spec ./openapi.json --out ./src/api

Flags:
  --spec   OpenAPI/Swagger JSON or YAML file
  --out    Directory for generated client files
`

export { parseArgs, helpText }
export type { CliArgs, GenerateArgs }
