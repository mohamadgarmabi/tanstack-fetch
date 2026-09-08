import type { JsonSchema } from './openapi.type'

const toPascal = (value: string) =>
  value
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('') || 'Schema'

const toCamel = (value: string) => {
  const pascal = toPascal(value)
  return pascal[0].toLowerCase() + pascal.slice(1)
}

const refName = (ref: string) => {
  const parts = ref.split('/')
  return toPascal(parts[parts.length - 1] ?? 'Schema')
}

const schemaToTs = (schema: JsonSchema | undefined): string => {
  if (!schema) {
    return 'unknown'
  }
  if (schema.$ref) {
    return refName(schema.$ref)
  }
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ')
  }
  const typeValue = Array.isArray(schema.type) ? schema.type[0] : schema.type
  if (typeValue === 'string') {
    return 'string'
  }
  if (typeValue === 'integer' || typeValue === 'number') {
    return 'number'
  }
  if (typeValue === 'boolean') {
    return 'boolean'
  }
  if (typeValue === 'array') {
    return `Array<${schemaToTs(schema.items)}>`
  }
  if (typeValue === 'object' || schema.properties) {
    return objectToTs(schema)
  }
  return 'unknown'
}

const objectToTs = (schema: JsonSchema) => {
  const required = new Set(schema.required ?? [])
  const fields = Object.entries(schema.properties ?? {}).map(([key, value]) => {
    const optional = required.has(key) ? '' : '?'
    return `  ${key}${optional}: ${schemaToTs(value)}`
  })
  if (fields.length === 0) {
    return 'Record<string, unknown>'
  }
  return `{\n${fields.join('\n')}\n}`
}

export { toPascal, toCamel, refName, schemaToTs }
