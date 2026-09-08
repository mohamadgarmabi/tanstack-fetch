import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'
import type { OpenApiSpec } from './openapi.type'

const loadSpec = async (specPath: string): Promise<OpenApiSpec> => {
  const raw = await readFile(specPath, 'utf8')
  const parsed: unknown =
    specPath.endsWith('.yaml') || specPath.endsWith('.yml') ? parseYaml(raw) : JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('tanstack-fetch: OpenAPI spec must be an object')
  }
  return parsed as OpenApiSpec
}

export { loadSpec }
