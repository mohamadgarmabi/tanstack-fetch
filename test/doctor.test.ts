import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { doctor } from '../src/cli/doctor'
import { parseArgs } from '../src/cli/parse-args'

const writeProject = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'tf-doctor-'))
  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = join(root, relativePath)
    mkdirSync(join(absolutePath, '..'), { recursive: true })
    writeFileSync(absolutePath, contents, 'utf8')
  }
  return root
}

describe('doctor', () => {
  it('parses doctor and --doctor', () => {
    expect(parseArgs(['doctor', '--dir', './src'])).toEqual({
      command: 'doctor',
      dir: './src',
    })
    expect(parseArgs(['--doctor', './app'])).toEqual({
      command: 'doctor',
      dir: './app',
    })
  })

  it('reports createFetch and legacy deps', () => {
    const root = writeProject({
      'package.json': JSON.stringify({
        dependencies: {
          'tanstack-fetch': '1.6.3',
          axios: '1.0.0',
          'solid-js': '1.0.0',
        },
      }),
      'src/api.ts': `import { createFetch } from 'tanstack-fetch'\nexport const api = createFetch({ baseUrl: '/' })\n`,
    })

    const result = doctor({ command: 'doctor', dir: root })
    const codes = result.findings.map((item) => item.code)
    expect(codes).toContain('has-tanstack-fetch')
    expect(codes).toContain('legacy-deps')
    expect(codes).toContain('create-fetch-count')
    expect(codes).toContain('frameworks')
    expect(result.exitCode).toBe(0)
  })

  it('warns on queryFn missing signal', () => {
    const root = writeProject({
      'package.json': JSON.stringify({ dependencies: { 'tanstack-fetch': '1.7.0' } }),
      'src/users.ts': `export const usersQueryOptions = {
  queryKey: ['users'],
  queryFn: () => api.get('/users'),
}
`,
    })

    const result = doctor({ command: 'doctor', dir: root })
    expect(result.findings.some((item) => item.code === 'missing-signal')).toBe(true)
    expect(result.exitCode).toBe(1)
  })
})
