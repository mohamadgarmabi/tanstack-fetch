import type {
  CollectedOperation,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiParameterRef,
  OpenApiSpec,
} from './openapi.type'
import { toCamel, uniqueName } from './schema-to-ts'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

const NDJSON_TYPES = ['application/x-ndjson', 'application/jsonl', 'application/json-seq']

const responseTypes = (operation: OpenApiOperation) =>
  Object.values(operation.responses ?? {}).flatMap((response) =>
    Object.keys(response.content ?? {}),
  )

const isSseOperation = (operation: OpenApiOperation) =>
  responseTypes(operation).some((type) => type.includes('event-stream'))

const isNdjsonOperation = (operation: OpenApiOperation) =>
  responseTypes(operation).some((type) => NDJSON_TYPES.includes(type))

const PARAMETER_REF_PREFIX = '#/components/parameters/'

const resolveParameter = (spec: OpenApiSpec, parameter: OpenApiParameter | OpenApiParameterRef) =>
  '$ref' in parameter
    ? parameter.$ref.startsWith(PARAMETER_REF_PREFIX)
      ? spec.components?.parameters?.[parameter.$ref.slice(PARAMETER_REF_PREFIX.length)]
      : undefined
    : parameter

/** Path-item parameters + operation parameters ($refs resolved); the operation wins on name + in. */
const mergeParameters = (
  spec: OpenApiSpec,
  ...lists: Array<Array<OpenApiParameter | OpenApiParameterRef> | undefined>
) => {
  const byKey = new Map<string, OpenApiParameter>()
  for (const raw of lists.flat()) {
    const parameter = raw && resolveParameter(spec, raw)
    if (parameter) byKey.set(`${parameter.in}:${parameter.name}`, parameter)
  }
  return [...byKey.values()]
}

const collectOperations = (spec: OpenApiSpec): CollectedOperation[] => {
  const operations: CollectedOperation[] = []
  /** Per tag: operationIds already used (getUser / get_user both camel-case to getUser). */
  const usedIds = new Map<string, Set<string>>()
  Object.entries(spec.paths ?? {}).forEach(([path, methods]) => {
    HTTP_METHODS.forEach((method) => {
      const operation = methods?.[method]
      if (!operation) {
        return
      }
      const tag = toCamel(operation.tags?.[0] ?? 'api')
      const fallbackId = `${method}_${path}`
      const used = usedIds.get(tag) ?? new Set<string>()
      usedIds.set(tag, used)
      operations.push({
        method: method.toUpperCase(),
        path,
        operationId: uniqueName(toCamel(operation.operationId ?? fallbackId), used),
        tag,
        isSse: isSseOperation(operation),
        isNdjson: isNdjsonOperation(operation),
        parameters: mergeParameters(spec, methods?.parameters, operation.parameters),
        bodySchema: operation.requestBody?.content?.['application/json']?.schema,
        successSchema: pickSuccessSchema(operation),
      })
    })
  })
  return operations
}

const pickSuccessSchema = (operation: OpenApiOperation) => {
  const success = operation.responses?.['200'] ?? operation.responses?.['201']
  const content = success?.content ?? {}
  return (
    content['application/json']?.schema ??
    content['text/event-stream']?.schema ??
    NDJSON_TYPES.map((type) => content[type]?.schema).find(Boolean)
  )
}

export { collectOperations }
