/**
 * Coverage probe: which migrate patterns are detected / rewritten / missed.
 * Run: npx tsx scripts/migrate-coverage-probe.ts
 */
import { axiosSource } from '../src/cli/migrate-sources/axios'
import { fetchSource } from '../src/cli/migrate-sources/fetch'
import { kySource } from '../src/cli/migrate-sources/ky'
import { ofetchSource } from '../src/cli/migrate-sources/ofetch'
import type { MigrateSource } from '../src/cli/migrate.type'

type PatternCase = {
  id: string
  hypothesisId: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  source: MigrateSource
  code: string
  /** substring that should appear after transform if covered */
  expectTransformed?: string
  /** finding kind that should appear if reported */
  expectFindingKind?: string
}

const cases: PatternCase[] = [
  // A — axios instance + shorthand
  {
    id: 'axios-instance-get',
    hypothesisId: 'A',
    source: axiosSource,
    code: `import axios from 'axios'\nconst client = axios.create({ baseURL: 'https://api.test' })\nexport const getUsers = () => client.get('/users')\n`,
    expectTransformed: 'createFetch(',
    expectFindingKind: 'call',
  },
  {
    id: 'axios-shorthand-url',
    hypothesisId: 'A',
    source: axiosSource,
    code: `import axios from 'axios'\nawait axios('/users')\n`,
    expectTransformed: 'api.get(',
    expectFindingKind: 'call',
  },
  {
    id: 'axios-shorthand-config',
    hypothesisId: 'A',
    source: axiosSource,
    code: `import axios from 'axios'\nawait axios({ url: '/users', method: 'post', data: { a: 1 } })\n`,
    expectFindingKind: 'call',
  },
  {
    id: 'axios-import-star',
    hypothesisId: 'A',
    source: axiosSource,
    code: `import * as axios from 'axios'\nawait axios.get('/users')\n`,
    expectTransformed: 'createFetch',
    expectFindingKind: 'import',
  },
  {
    id: 'axios-require',
    hypothesisId: 'A',
    source: axiosSource,
    code: `const axios = require('axios')\nawait axios.get('/users')\n`,
    expectTransformed: 'api.get(',
    expectFindingKind: 'import',
  },
  {
    id: 'axios-params-to-query',
    hypothesisId: 'A',
    source: axiosSource,
    code: `import axios from 'axios'\nawait axios.get('/users', { params: { page: 1 } })\n`,
    expectTransformed: 'query:',
    expectFindingKind: 'query-params',
  },
  {
    id: 'axios-response-data',
    hypothesisId: 'A',
    source: axiosSource,
    code: `import axios from 'axios'\nconst { data } = await axios.get('/users')\nreturn data\n`,
    expectFindingKind: 'data',
  },
  // B — ky instance
  {
    id: 'ky-instance-get-json',
    hypothesisId: 'B',
    source: kySource,
    code: `import ky from 'ky'\nconst client = ky.create({ prefixUrl: 'https://api.test' })\nreturn client.get('users').json()\n`,
    expectTransformed: 'createFetch(',
    expectFindingKind: 'call',
  },
  {
    id: 'ky-searchParams',
    hypothesisId: 'B',
    source: kySource,
    code: `import ky from 'ky'\nawait ky.get('users', { searchParams: { page: 1 } }).json()\n`,
    expectTransformed: 'query:',
    expectFindingKind: 'query-params',
  },
  // C — ofetch / $fetch transforms
  {
    id: 'dollar-fetch-get',
    hypothesisId: 'C',
    source: ofetchSource,
    code: `export const getUsers = () => $fetch('/users')\n`,
    expectTransformed: 'api.get(',
    expectFindingKind: 'call',
  },
  {
    id: 'ofetch-call',
    hypothesisId: 'C',
    source: ofetchSource,
    code: `import { ofetch } from 'ofetch'\nawait ofetch('/users', { method: 'GET' })\n`,
    expectTransformed: 'api.get(',
    expectFindingKind: 'call',
  },
  {
    id: 'ofetch-post',
    hypothesisId: 'C',
    source: ofetchSource,
    code: `await $fetch('/users', { method: 'POST', body: { name: 'Ada' } })\n`,
    expectTransformed: 'api.post(',
    expectFindingKind: 'call',
  },
  // D — raw fetch variants
  {
    id: 'fetch-let-await',
    hypothesisId: 'D',
    source: fetchSource,
    code: `let res = await fetch('/users')\nif (!res.ok) throw new Error()\nreturn res.json()\n`,
    expectFindingKind: 'call',
  },
  {
    id: 'fetch-void',
    hypothesisId: 'D',
    source: fetchSource,
    code: `void fetch('/ping')\n`,
    expectFindingKind: 'call',
  },
  {
    id: 'fetch-then',
    hypothesisId: 'D',
    source: fetchSource,
    code: `fetch('/users').then((res) => res.json())\n`,
    expectFindingKind: 'call',
  },
  // E — interceptors / defaults reported
  {
    id: 'axios-defaults',
    hypothesisId: 'E',
    source: axiosSource,
    code: `import axios from 'axios'\naxios.defaults.baseURL = 'https://api.test'\naxios.defaults.headers.common.Authorization = 'Bearer x'\n`,
    expectFindingKind: 'manual',
  },
  {
    id: 'axios-interceptor',
    hypothesisId: 'E',
    source: axiosSource,
    code: `import axios from 'axios'\naxios.interceptors.request.use((c) => c)\n`,
    expectFindingKind: 'interceptor',
  },
  // F — destructured response / await chain
  {
    id: 'axios-await-dot-data',
    hypothesisId: 'F',
    source: axiosSource,
    code: `import axios from 'axios'\nreturn (await axios.get('/users')).data\n`,
    expectTransformed: 'api.get',
    expectFindingKind: 'data',
  },
]

const run = () => {
  const summary = { detected: 0, transformed: 0, findingOk: 0, missed: [] as string[] }

  for (const item of cases) {
    const detected = item.source.detect(item.code)
    const transformed = item.source.applySafeTransforms(item.code)
    const findings = item.source.collectFindings(`${item.id}.ts`, item.code)
    const transformOk = item.expectTransformed
      ? transformed.includes(item.expectTransformed)
      : transformed !== item.code
    const findingOk = item.expectFindingKind
      ? findings.some((f) => f.kind === item.expectFindingKind)
      : findings.length > 0

    if (detected) summary.detected += 1
    if (transformOk) summary.transformed += 1
    if (findingOk) summary.findingOk += 1

    const gap =
      !detected ||
      (item.expectTransformed && !transformOk) ||
      (item.expectFindingKind && !findingOk)
    if (gap) summary.missed.push(item.id)
  }

  console.log(
    JSON.stringify(
      {
        total: cases.length,
        detected: summary.detected,
        transformed: summary.transformed,
        findingOk: summary.findingOk,
        missed: summary.missed,
      },
      null,
      2,
    ),
  )
}

run()
