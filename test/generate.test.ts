import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generateClient } from '../src/cli/generate'
import { parseArgs } from '../src/cli/parse-args'
import type { OpenApiSpec } from '../src/cli/openapi.type'

const spec: OpenApiSpec = {
  openapi: '3.0.0',
  info: { title: 'Demo', version: '1.0.0' },
  paths: {
    '/users': {
      get: {
        operationId: 'listUsers',
        tags: ['users'],
        parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }],
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              },
            },
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        operationId: 'getUser',
        tags: ['users'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/User' } },
            },
          },
        },
      },
    },
    '/events': {
      get: {
        operationId: 'streamEvents',
        tags: ['events'],
        responses: {
          '200': {
            content: {
              'text/event-stream': { schema: { $ref: '#/components/schemas/OrderEvent' } },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'name'],
        properties: { id: { type: 'string' }, name: { type: 'string' } },
      },
      OrderEvent: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'number' }, status: { type: 'string' } },
      },
    },
  },
}

describe('tanstack-fetch generate', () => {
  it('requires spec and out flags', () => {
    expect(() => parseArgs(['generate'])).toThrow('--spec')
    const args = parseArgs(['generate', '--spec', './openapi.json', '--out', './src/api'])
    expect(args).toEqual({ command: 'generate', spec: './openapi.json', out: './src/api' })
  })

  it('writes typed client files from OpenAPI', async () => {
    const out = await mkdtemp(join(tmpdir(), 'tanstack-fetch-'))
    await generateClient(spec, out)
    const types = await readFile(join(out, 'types.ts'), 'utf8')
    const client = await readFile(join(out, 'client.ts'), 'utf8')

    expect(types).toContain('type User =')
    expect(client).toContain("api.get<User>('/users/:id'")
    expect(client).toContain("api.sse<OrderEvent>('/events'")
    expect(client).toContain('listUsers')
    expect(client).toContain("from 'tanstack-fetch/sse'")
  })
})
