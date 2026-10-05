import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { migrate } from '../src/cli/migrate'
import { axiosSource } from '../src/cli/migrate-sources/axios'
import { fetchSource } from '../src/cli/migrate-sources/fetch'
import { kySource } from '../src/cli/migrate-sources/ky'
import { ofetchSource } from '../src/cli/migrate-sources/ofetch'
import { parseArgs } from '../src/cli/parse-args'

describe('migrate transforms', () => {
  it('rewrites axios', () => {
    const output = axiosSource.applySafeTransforms(
      `import axios, { AxiosError, isAxiosError } from 'axios'\nconst c = axios.create({ baseURL: 'https://api.example.com' })\nawait axios.get('/users')\n`,
    )
    expect(output).toContain("from 'tanstack-fetch'")
    expect(output).toContain('createFetch(')
    expect(output).toContain('baseUrl:')
    expect(output).toContain('api.get')
    expect(output).not.toContain('axios')
  })

  it('rewrites ky', () => {
    const output = kySource.applySafeTransforms(
      `import ky from 'ky'\nconst api = ky.create({ prefixUrl: 'https://api.example.com' })\nawait ky.get('/users').json()\n`,
    )
    expect(output).toContain('createFetch(')
    expect(output).toContain('baseUrl:')
    expect(output).toContain('api.get')
    expect(output).not.toContain('.json()')
  })

  it('rewrites ofetch create', () => {
    const output = ofetchSource.applySafeTransforms(
      `import { ofetch } from 'ofetch'\nconst api = ofetch.create({ baseURL: 'https://api.example.com' })\n`,
    )
    expect(output).toContain('createFetch(')
    expect(output).toContain('baseUrl:')
  })

  it('detects raw fetch', () => {
    expect(fetchSource.detect(`const res = await fetch('/users')\n`)).toBe(true)
    const findings = fetchSource.collectFindings('a.ts', `const res = await fetch('/users')\nif (!res.ok) throw new Error()\nreturn res.json()\n`)
    expect(findings.some((item) => item.kind === 'call')).toBe(true)
    expect(findings.some((item) => item.kind === 'data')).toBe(true)
  })
})

describe('migrate runner', () => {
  it('writes axios transforms and scaffold', () => {
    const root = mkdtempSync(join(tmpdir(), 'tf-mig-'))
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(
      join(root, 'src', 'users.ts'),
      `import axios from 'axios'\nexport const getUsers = () => axios.get('/users')\n`,
    )

    const result = migrate({
      command: 'migrate',
      from: 'axios',
      dir: root,
      write: true,
      scaffold: 'src/lib/api.ts',
    })

    expect(result.filesChanged).toBe(1)
    expect(result.scaffoldWritten).toBe('src/lib/api.ts')
    expect(readFileSync(join(root, 'src', 'users.ts'), 'utf8')).toContain('api.get')
  })

  it('writes react framework scaffold without provider by default', () => {
    const root = mkdtempSync(join(tmpdir(), 'tf-mig-react-'))
    const result = migrate({
      command: 'migrate',
      from: 'axios',
      dir: root,
      write: true,
      framework: 'react',
      provider: false,
    })

    expect(result.scaffoldsWritten).toContain('src/lib/api.ts')
    expect(result.scaffoldsWritten).not.toContain('src/lib/fetch-provider.tsx')
    expect(result.scaffoldsWritten).toContain('src/queries/users.ts')
    expect(result.frameworkTip).toMatch(/client: api/)
    expect(readFileSync(join(root, 'src/lib/api.ts'), 'utf8')).toContain('createFetch')
  })

  it('writes react FetchProvider when provider is true', () => {
    const root = mkdtempSync(join(tmpdir(), 'tf-mig-react-prov-'))
    const result = migrate({
      command: 'migrate',
      from: 'axios',
      dir: root,
      write: true,
      framework: 'react',
      provider: true,
    })

    expect(result.scaffoldsWritten).toContain('src/lib/fetch-provider.tsx')
    expect(result.frameworkTip).toMatch(/FetchProvider/)
  })

  it('writes nuxt framework scaffold', () => {
    const root = mkdtempSync(join(tmpdir(), 'tf-mig-nuxt-'))
    const result = migrate({
      command: 'migrate',
      from: 'ofetch',
      dir: root,
      write: true,
      framework: 'nuxt',
    })

    expect(result.scaffoldsWritten).toEqual(
      expect.arrayContaining([
        'lib/api.ts',
        'plugins/tanstack-fetch.ts',
        'composables/useApi.ts',
      ]),
    )
    expect(result.frameworkTip).toMatch(/useFetch/)
  })
})

describe('parseArgs migrate', () => {
  it('requires --from for migrate', () => {
    expect(() => parseArgs(['migrate'])).toThrow(/--from/)
  })

  it('parses migrate --from ky --write', () => {
    expect(parseArgs(['migrate', '--from', 'ky', '--write', '--dir', './app'])).toEqual({
      command: 'migrate',
      from: 'ky',
      dir: './app',
      write: true,
      scaffold: undefined,
      framework: undefined,
      provider: undefined,
    })
  })

  it('parses --framework nextjs', () => {
    expect(
      parseArgs(['migrate', '--from', 'fetch', '--framework', 'nextjs', '--write']),
    ).toEqual({
      command: 'migrate',
      from: 'fetch',
      dir: '.',
      write: true,
      scaffold: undefined,
      framework: 'nextjs',
      provider: undefined,
    })
  })

  it('parses --provider / --no-provider', () => {
    expect(
      parseArgs(['migrate', '--from', 'axios', '--framework', 'react', '--provider']),
    ).toMatchObject({ provider: true, framework: 'react' })
    expect(
      parseArgs(['migrate', '--from', 'axios', '--framework', 'react', '--no-provider']),
    ).toMatchObject({ provider: false, framework: 'react' })
  })

  it('aliases migrate-axios', () => {
    expect(parseArgs(['migrate-axios', '--write'])).toEqual({
      command: 'migrate',
      from: 'axios',
      dir: '.',
      write: true,
      scaffold: undefined,
      framework: undefined,
      provider: undefined,
    })
  })
})
