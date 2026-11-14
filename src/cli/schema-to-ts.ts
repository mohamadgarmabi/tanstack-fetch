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

/** Raw component schema name → unique TS type name. */
type SchemaNames = Map<string, string>

/** `base`, or `base2`, `base3`, … when already taken. Records the result in `used`. */
const uniqueName = (base: string, used: Set<string>) => {
  let name = base
  for (let suffix = 2; used.has(name); suffix += 1) {
    name = `${base}${suffix}`
  }
  used.add(name)
  return name
}

/** `user-profile` and `user_profile` both PascalCase to `UserProfile` — suffix the later ones. */
const schemaTypeNames = (schemas: Record<string, JsonSchema> = {}): SchemaNames => {
  const used = new Set<string>()
  return new Map(Object.keys(schemas).map((name) => [name, uniqueName(toPascal(name), used)]))
}

/** Property / param key: bare when a valid identifier, otherwise quoted (`'content-type'`, `'@id'`). */
const propertyKey = (key: string) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key))

const refName = (ref: string, names?: SchemaNames) => {
  const parts = ref.split('/')
  const name = parts[parts.length - 1] ?? 'Schema'
  return names?.get(name) ?? toPascal(name)
}

const schemaToTs = (schema: JsonSchema | undefined, names?: SchemaNames): string => {
  if (!schema) {
    return 'unknown'
  }
  if (schema.$ref) {
    return refName(schema.$ref, names)
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
    return `Array<${schemaToTs(schema.items, names)}>`
  }
  if (typeValue === 'object' || schema.properties) {
    return objectToTs(schema, names)
  }
  return 'unknown'
}

const objectToTs = (schema: JsonSchema, names?: SchemaNames) => {
  const required = new Set(schema.required ?? [])
  const fields = Object.entries(schema.properties ?? {}).map(([key, value]) => {
    const optional = required.has(key) ? '' : '?'
    return `  ${propertyKey(key)}${optional}: ${schemaToTs(value, names)}`
  })
  if (fields.length === 0) {
    return 'Record<string, unknown>'
  }
  return `{\n${fields.join('\n')}\n}`
}

export { toPascal, toCamel, refName, schemaToTs, schemaTypeNames, propertyKey, uniqueName }
export type { SchemaNames }
