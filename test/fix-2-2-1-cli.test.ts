import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectOperations } from '../src/cli/collect-operations'
import { generateClientFile, generateTypesFile } from '../src/cli/generate'
import { migrate, SCAFFOLD_SOURCE } from '../src/cli/migrate'
import { resolveFrameworkScaffold } from '../src/cli/migrate-frameworks'
import { axiosSource } from '../src/cli/migrate-sources/axios'
import { kySource } from '../src/cli/migrate-sources/ky'
import { ensureTanstackFetchImport } from '../src/cli/migrate-sources/migrate-source.util'
import type { OpenApiSpec } from '../src/cli/openapi.type'

const countTanstackImports = (source: string) => source.match(/from 'tanstack-fetch'/g)?.length ?? 0

describe('2.2.1 CLI: ky .json() stripping (bug 1)', () => {
  it('strips .json<T>() and moves the type argument onto the call', () => {
    const out = kySource.applySafeTransforms(
      `import ky from 'ky'\nconst user = await ky.get('/users/1').json<User>()\n`,
    )
    expect(out).toContain("api.get<User>('/users/1')")
    expect(out).not.toContain('.json')
  })

  it('strips .json() after arguments containing nested parens', () => {
    const out = kySource.applySafeTransforms(
      "import ky from 'ky'\nawait ky.get(`/u/${encodeURIComponent(id)}`).json()\nawait ky.post('/x', { json: f(a, (b)) }).json()\n",
    )
    expect(out).toContain('api.get(`/u/${encodeURIComponent(id)}`)\n')
    expect(out).toContain("api.post('/x', { json: f(a, (b)) })\n")
    expect(out).not.toContain('.json()')
  })
})

describe('2.2.1 CLI: api binding (bug 2)', () => {
  const setup = (files: Record<string, string>) => {
    const root = mkdtempSync(join(tmpdir(), 'tf-221-cli-'))
    for (const [path, contents] of Object.entries(files)) {
      mkdirSync(join(root, path, '..'), { recursive: true })
      writeFileSync(join(root, path), contents)
    }
    return root
  }

  it('imports api from the scaffolded module with a relative path', () => {
    const root = setup({
      'src/features/users.ts': `import axios from 'axios'\nexport const getUsers = () => axios.get('/users')\n`,
    })
    migrate({ command: 'migrate', from: 'axios', dir: root, write: true })
    const out = readFileSync(join(root, 'src/features/users.ts'), 'utf8')
    expect(out).toContain("import { api } from '../lib/api'")
    expect(out).toContain("axios.get('/users')".replace('axios', 'api'))
    expect(readFileSync(join(root, 'src/lib/api.ts'), 'utf8')).toContain('export const api')
  })

  it('uses the framework api module path', () => {
    const root = setup({
      'src/app/users.service.ts': `import ky from 'ky'\nexport const load = () => ky.get('users').json()\n`,
    })
    migrate({ command: 'migrate', from: 'ky', dir: root, write: true, framework: 'angular' })
    const out = readFileSync(join(root, 'src/app/users.service.ts'), 'utf8')
    expect(out).toContain("import { api } from './api'")
  })

  it('does not import api when the file already declares it', () => {
    const root = setup({
      'src/client.ts': `import axios from 'axios'\nconst api = axios.create({ baseURL: '/x' })\nexport const go = () => axios.get('/y')\n`,
    })
    migrate({ command: 'migrate', from: 'axios', dir: root, write: true })
    const out = readFileSync(join(root, 'src/client.ts'), 'utf8')
    expect(out).not.toContain('import { api }')
  })

  it('leaves the file unchanged with --no-scaffold and no api module', () => {
    const source = `import axios from 'axios'\nexport const getUsers = () => axios.get('/users')\n`
    const root = setup({ 'src/users.ts': source })
    const result = migrate({
      command: 'migrate',
      from: 'axios',
      dir: root,
      write: true,
      scaffold: null,
    })
    expect(readFileSync(join(root, 'src/users.ts'), 'utf8')).toBe(source)
    expect(result.filesChanged).toBe(0)
    expect(result.findings.some((item) => item.note.startsWith('Not rewritten'))).toBe(true)
  })

  it('reuses an existing api module with --no-scaffold', () => {
    const root = setup({
      'src/lib/api.ts': SCAFFOLD_SOURCE,
      'src/users.ts': `import axios from 'axios'\nexport const getUsers = () => axios.get('/users')\n`,
    })
    migrate({ command: 'migrate', from: 'axios', dir: root, write: true, scaffold: null })
    expect(readFileSync(join(root, 'src/users.ts'), 'utf8')).toContain(
      "import { api } from './lib/api'",
    )
  })
})

describe('2.2.1 CLI: import insertion (bug 3)', () => {
  it('inserts after shebang and directive prologue', () => {
    const out = ensureTanstackFetchImport(`#!/usr/bin/env node\n'use client'\nconst x = 1\n`)
    expect(out).toBe(
      `#!/usr/bin/env node\n'use client'\nimport { createFetch } from 'tanstack-fetch'\n\nconst x = 1\n`,
    )
    expect(ensureTanstackFetchImport(`"use server";\nexport {}\n`)).toMatch(
      /^"use server";\nimport \{ createFetch \}/,
    )
  })

  it('handles multi-line first import', () => {
    const out = ensureTanstackFetchImport(`import {\n  a,\n  b,\n} from 'x'\nconst y = a\n`)
    expect(out).toBe(
      `import {\n  a,\n  b,\n} from 'x'\nimport { createFetch } from 'tanstack-fetch'\nconst y = a\n`,
    )
  })

  it('merges into an existing tanstack-fetch import', () => {
    expect(
      ensureTanstackFetchImport(`import { isFetchError } from 'tanstack-fetch'\n`, ['createFetch']),
    ).toBe(`import { isFetchError, createFetch } from 'tanstack-fetch'\n`)
  })
})

describe('2.2.1 CLI: axios params → query only in config (bug 4)', () => {
  it('does not touch params inside request bodies', () => {
    const out = axiosSource.applySafeTransforms(
      `import axios from 'axios'\nawait axios.post('/search', { params: ['a'] })\nawait axios.post('/s', { params: 1 }, { params: { q: 1 } })\nawait axios.get('/u', { params: { page: 1 }, headers: { params: 'x' } })\nawait axios.delete('/u', { params })\n`,
    )
    expect(out).toContain("api.post('/search', { params: ['a'] })")
    expect(out).toContain("api.post('/s', { params: 1 }, { query: { q: 1 } })")
    expect(out).toContain("api.get('/u', { query: { page: 1 }, headers: { params: 'x' } })")
    expect(out).toContain("api.delete('/u', { query: params })")
  })
})

describe('2.2.1 CLI: --from all imports once (bug 5)', () => {
  it('merges axios + ky tanstack-fetch imports', () => {
    const source = `import axios from 'axios'\nimport ky from 'ky'\nawait axios.get('/a')\nawait ky.get('b').json()\n`
    const out = kySource.applySafeTransforms(axiosSource.applySafeTransforms(source))
    expect(countTanstackImports(out)).toBe(1)
  })

  it('migrate --from all writes one tanstack-fetch import', () => {
    const root = mkdtempSync(join(tmpdir(), 'tf-221-all-'))
    mkdirSync(join(root, 'src'))
    writeFileSync(
      join(root, 'src/mix.ts'),
      `import axios from 'axios'\nimport ky from 'ky'\nawait axios.get('/a')\nawait ky.get('b').json()\n`,
    )
    migrate({ command: 'migrate', from: 'all', dir: root, write: true })
    const out = readFileSync(join(root, 'src/mix.ts'), 'utf8')
    expect(countTanstackImports(out)).toBe(1)
    expect(out.match(/import \{ api \}/g)).toHaveLength(1)
  })
})

describe('2.2.1 CLI: OpenAPI generator (bug 6)', () => {
  const spec: OpenApiSpec = {
    openapi: '3.0.0',
    paths: {
      '/users/{id}': {
        parameters: [
          { $ref: '#/components/parameters/UserId' },
          { name: 'X-Trace', in: 'query', schema: { type: 'string' } },
        ],
        get: {
          operationId: 'getUser',
          tags: ['users'],
          parameters: [
            { name: 'X-Trace', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/user_profile' } },
              },
            },
          },
        },
        put: { operationId: 'get_user', tags: ['users'] },
      },
    },
    components: {
      parameters: {
        UserId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      },
      schemas: {
        'user-profile': {
          type: 'object',
          properties: { 'content-type': { type: 'string' }, '@id': { type: 'string' } },
        },
        user_profile: { type: 'object', properties: { name: { type: 'string' } } },
      },
    },
  }

  it('quotes non-identifier keys and de-dupes schema names', () => {
    const types = generateTypesFile(spec)
    expect(types).toContain('"content-type"?: string')
    expect(types).toContain('"@id"?: string')
    expect(types).toContain('type UserProfile = ')
    expect(types).toContain('type UserProfile2 = ')
    expect(types).toContain('export type { UserProfile, UserProfile2 }')
  })

  it('merges path-level and $ref parameters and de-dupes operationIds', () => {
    const operations = collectOperations(spec)
    expect(operations.map((item) => item.operationId)).toEqual(['getUser', 'getUser2'])
    const get = operations[0]
    expect(get.parameters).toEqual([
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'X-Trace', in: 'query', required: true, schema: { type: 'string' } },
    ])
    const client = generateClientFile(spec, operations)
    expect(client).toContain('params: { id: string }')
    expect(client).toContain('query?: { "X-Trace": string }')
    expect(client).toContain('getUser: (options: ')
    expect(client).toContain('getUser2: (options: ')
    expect(client).toContain('api.get<UserProfile2, { id: string }>')
  })
})

describe('2.2.1 CLI: framework env access (bug 7)', () => {
  const apiFile = (framework: Parameters<typeof resolveFrameworkScaffold>[0]) =>
    resolveFrameworkScaffold(framework).files.find((file) =>
      file.contents.includes('export const api'),
    )?.contents ?? ''

  it('react (Vite) uses import.meta.env only', () => {
    expect(apiFile('react')).toContain('import.meta.env.VITE_API_URL')
    expect(apiFile('react')).not.toContain('process.env')
  })

  it('nextjs uses process.env only', () => {
    expect(apiFile('nextjs')).toContain('process.env.NEXT_PUBLIC_API_URL')
    expect(apiFile('nextjs')).not.toContain('import.meta')
  })

  it('nuxt and generic scaffolds guard process', () => {
    expect(apiFile('nuxt')).toContain("typeof process === 'undefined'")
    expect(SCAFFOLD_SOURCE).toContain("typeof process === 'undefined'")
    expect(SCAFFOLD_SOURCE).not.toContain('import.meta')
  })

  it('no scaffold mixes import.meta.env and process.env', () => {
    for (const framework of [
      'react',
      'vue',
      'nuxt',
      'nextjs',
      'solid',
      'angular',
      'svelte',
      'sveltekit',
    ] as const) {
      for (const file of resolveFrameworkScaffold(framework).files) {
        const mixed =
          file.contents.includes('import.meta.env') && file.contents.includes('process.env')
        expect(mixed, `${framework}:${file.path}`).toBe(false)
      }
    }
  })
})
