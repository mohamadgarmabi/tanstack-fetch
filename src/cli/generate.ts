import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { CollectedOperation, OpenApiSpec } from './openapi.type'
import { collectOperations } from './collect-operations'
import { schemaToTs, toPascal } from './schema-to-ts'

const generateTypesFile = (spec: OpenApiSpec) => {
  const schemas = Object.entries(spec.components?.schemas ?? {})
  const types = schemas.map(([name, schema]) => `type ${toPascal(name)} = ${schemaToTs(schema)}`)
  const exports = schemas.map(([name]) => toPascal(name))
  if (exports.length === 0) {
    return 'export {}\n'
  }
  return `${types.join('\n\n')}\n\nexport type { ${exports.join(', ')} }\n`
}

const paramsType = (operation: CollectedOperation, kind: 'path' | 'query') => {
  const params = operation.parameters.filter((item) => item.in === kind)
  if (params.length === 0) {
    return undefined
  }
  const fields = params.map((item) => {
    const optional = item.required ? '' : '?'
    return `${item.name}${optional}: ${schemaToTs(item.schema)}`
  })
  return `{ ${fields.join('; ')} }`
}

const optionsType = (operation: CollectedOperation) => {
  const fields: string[] = []
  const pathType = paramsType(operation, 'path')
  const queryType = paramsType(operation, 'query')
  if (pathType) {
    fields.push(`params: ${pathType}`)
  }
  if (queryType) {
    fields.push(`query?: ${queryType}`)
  }
  if (operation.bodySchema) {
    fields.push(`body: ${schemaToTs(operation.bodySchema)}`)
  }
  if (fields.length === 0) {
    return 'RequestOptions | undefined'
  }
  return `Omit<RequestOptions, 'params' | 'query' | 'body'> & { ${fields.join('; ')} }`
}

const clientPath = (path: string) => path.replace(/\{([A-Za-z0-9_]+)\}/g, ':$1')

const methodLine = (operation: CollectedOperation) => {
  const response = schemaToTs(operation.successSchema)
  const options = optionsType(operation)
  const optional = options.endsWith('| undefined') ? '?' : ''
  const pathType = paramsType(operation, 'path')
  const liveGenerics = pathType ? `<${response}, ${pathType}>` : `<${response}>`
  if (operation.isSse) {
    return `    ${operation.operationId}: (options${optional}: ${options}) => api.sse${liveGenerics}('${clientPath(operation.path)}', options),`
  }
  if (operation.isNdjson) {
    return `    ${operation.operationId}: (options${optional}: ${options}) => api.stream${liveGenerics}('${clientPath(operation.path)}', { ...options, method: '${operation.method}' }),`
  }
  const method = operation.method.toLowerCase()
  const bodyType = operation.bodySchema ? schemaToTs(operation.bodySchema) : undefined
  const hasBody = Boolean(bodyType) && method !== 'get' && method !== 'delete'
  const generics =
    pathType && hasBody
      ? `<${response}, ${pathType}, ${bodyType}>`
      : pathType
        ? `<${response}, ${pathType}>`
        : hasBody
          ? `<${response}, NoParams, ${bodyType}>`
          : `<${response}>`
  return `    ${operation.operationId}: (options${optional}: ${options}) => api.${method}${generics}('${clientPath(operation.path)}', options),`
}

const generateClientFile = (spec: OpenApiSpec, operations: CollectedOperation[]) => {
  const tags = [...new Set(operations.map((item) => item.tag))]
  const groups = tags.map((tag) => {
    const lines = operations.filter((item) => item.tag === tag).map(methodLine)
    return `    ${tag}: {\n${lines.join('\n')}\n    },`
  })
  const schemaNames = Object.keys(spec.components?.schemas ?? {}).map((name) => toPascal(name))
  const typesImport =
    schemaNames.length > 0 ? `import type { ${schemaNames.join(', ')} } from './types'\n` : ''
  const hasSse = operations.some((item) => item.isSse)
  const hasNdjson = operations.some((item) => item.isNdjson)
  const needsNoParams = operations.some((item) => {
    if (item.isSse || item.isNdjson || !item.bodySchema) {
      return false
    }
    const method = item.method.toLowerCase()
    if (method === 'get' || method === 'delete') {
      return false
    }
    return !paramsType(item, 'path')
  })
  const typeImports = ['CreateFetchOptions', 'RequestOptions']
  if (needsNoParams) {
    typeImports.push('NoParams')
  }
  const createFetchEntry = hasNdjson
    ? 'tanstack-fetch/live'
    : hasSse
      ? 'tanstack-fetch/sse'
      : 'tanstack-fetch'
  const fetchImport = `import { createFetch } from '${createFetchEntry}'
import type { ${typeImports.join(', ')} } from 'tanstack-fetch'`

  return `${fetchImport}
${typesImport}
const createApi = (options: CreateFetchOptions = {}) => {
  const api = createFetch(options)
  return {
${groups.join('\n')}
  }
}

export { createApi }
`
}

const generateIndexFile = () => `import { createApi } from './client'

export { createApi }
export type * from './types'
`

const generateClient = async (spec: OpenApiSpec, outDir: string) => {
  const operations = collectOperations(spec)
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'types.ts'), generateTypesFile(spec), 'utf8')
  await writeFile(join(outDir, 'client.ts'), generateClientFile(spec, operations), 'utf8')
  await writeFile(join(outDir, 'index.ts'), generateIndexFile(), 'utf8')
}

export { generateClient, generateTypesFile, generateClientFile }
