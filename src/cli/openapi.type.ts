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

type OpenApiParameterRef = { $ref: string }

type OpenApiMedia = {
  schema?: JsonSchema
}

type OpenApiOperation = {
  operationId?: string
  tags?: string[]
  parameters?: Array<OpenApiParameter | OpenApiParameterRef>
  requestBody?: {
    required?: boolean
    content?: Record<string, OpenApiMedia>
  }
  responses?: Record<string, { content?: Record<string, OpenApiMedia> }>
}

type OpenApiPathItem = Partial<
  Record<
    'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace',
    OpenApiOperation
  >
> & {
  /** Shared by every operation under this path; an operation overrides by name + in. */
  parameters?: Array<OpenApiParameter | OpenApiParameterRef>
}

type OpenApiSpec = {
  openapi?: string
  swagger?: string
  info?: { title?: string; version?: string }
  paths?: Record<string, OpenApiPathItem>
  components?: {
    schemas?: Record<string, JsonSchema>
    parameters?: Record<string, OpenApiParameter>
  }
}

type CollectedOperation = {
  method: string
  path: string
  operationId: string
  tag: string
  isSse: boolean
  /** `application/x-ndjson` / `application/jsonl` response → `api.stream`. */
  isNdjson: boolean
  parameters: OpenApiParameter[]
  bodySchema?: JsonSchema
  successSchema?: JsonSchema
}

export type {
  JsonSchema,
  OpenApiParameter,
  OpenApiParameterRef,
  OpenApiOperation,
  OpenApiPathItem,
  OpenApiSpec,
  CollectedOperation,
}
