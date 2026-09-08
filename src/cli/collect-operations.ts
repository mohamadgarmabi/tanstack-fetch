import type { CollectedOperation, OpenApiOperation, OpenApiSpec } from './openapi.type'
import { toCamel } from './schema-to-ts'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

const isSseOperation = (operation: OpenApiOperation) => {
  const contents = Object.values(operation.responses ?? {}).flatMap((response) =>
    Object.keys(response.content ?? {}),
  )
  return contents.some((type) => type.includes('event-stream'))
}

const collectOperations = (spec: OpenApiSpec): CollectedOperation[] => {
  const operations: CollectedOperation[] = []
  Object.entries(spec.paths ?? {}).forEach(([path, methods]) => {
    HTTP_METHODS.forEach((method) => {
      const operation = methods?.[method]
      if (!operation) {
        return
      }
      const tag = operation.tags?.[0] ?? 'api'
      const fallbackId = `${method}_${path}`
      operations.push({
        method: method.toUpperCase(),
        path,
        operationId: toCamel(operation.operationId ?? fallbackId),
        tag: toCamel(tag),
        isSse: isSseOperation(operation),
        parameters: operation.parameters ?? [],
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
  return content['application/json']?.schema ?? content['text/event-stream']?.schema
}

export { collectOperations }
