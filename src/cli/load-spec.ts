import { readFile } from 'node:fs/promises'
import type { OpenApiSpec } from './openapi.type'

const loadYaml = async (raw: string): Promise<unknown> => {
  try {
    const mod = await import('yaml')
    return mod.parse(raw)
  } catch {
    throw new Error('tanstack-fetch: install optional peer "yaml" to load YAML specs (npm i yaml)')
  }
}

const loadSpec = async (specPath: string): Promise<OpenApiSpec> => {
  const raw = await readFile(specPath, 'utf8')
  const parsed: unknown =
    specPath.endsWith('.yaml') || specPath.endsWith('.yml') ? await loadYaml(raw) : JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('tanstack-fetch: OpenAPI spec must be an object')
  }
  return parsed as OpenApiSpec
}

export { loadSpec }
