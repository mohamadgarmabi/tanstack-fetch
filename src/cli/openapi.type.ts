type JsonSchema = {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  required?: string[]
  $ref?: string
  enum?: Array<string | number | boolean>
  additionalProperties?: boolean | JsonSchema
  allOf?: JsonSchema[]
  nullable?: boolean
}

type OpenApiParameter = {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  schema?: JsonSchema
}

type OpenApiMedia = {
  schema?: JsonSchema
}

type OpenApiOperation = {
  operationId?: string
  tags?: string[]
  parameters?: OpenApiParameter[]
  requestBody?: {
    required?: boolean
    content?: Record<string, OpenApiMedia>
  }
  responses?: Record<string, { content?: Record<string, OpenApiMedia> }>
}

type OpenApiSpec = {
  openapi?: string
  swagger?: string
  info?: { title?: string; version?: string }
  paths?: Record<string, Partial<Record<string, OpenApiOperation>>>
  components?: { schemas?: Record<string, JsonSchema> }
}

type CollectedOperation = {
  method: string
  path: string
  operationId: string
  tag: string
  isSse: boolean
  parameters: OpenApiParameter[]
  bodySchema?: JsonSchema
  successSchema?: JsonSchema
}

export type { JsonSchema, OpenApiParameter, OpenApiOperation, OpenApiSpec, CollectedOperation }
