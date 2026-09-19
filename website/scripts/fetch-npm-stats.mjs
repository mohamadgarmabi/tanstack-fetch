import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packages = [
  'tanstack-fetch',
  'vite-plugin-react-splash',
  'url-validation-query',
  'sse-shared-worker-react-hook',
  'react-video-capture',
  'react-performanalyzer',
  'sse-crossframework',
  'image-auth',
  'react-providers-tree',
  'frontend-stack-cli',
]

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'data', 'npm-packages.json')

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} → ${response.status}`)
  return response.json()
}

try {
  const rows = []
  for (const name of packages) {
    const [weekly, monthly, meta] = await Promise.all([
      fetchJson(`https://api.npmjs.org/downloads/point/last-week/${name}`),
      fetchJson(`https://api.npmjs.org/downloads/point/last-month/${name}`),
      fetchJson(`https://registry.npmjs.org/${name}`),
    ])
    rows.push({
      name,
      version: meta['dist-tags']?.latest ?? '?',
      weekly: weekly.downloads ?? 0,
      monthly: monthly.downloads ?? 0,
      description: String(meta.description ?? '').slice(0, 120),
    })
    console.log(`${name} week=${weekly.downloads} month=${monthly.downloads}`)
  }

  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(
    out,
    `${JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        author: 'Mohammad Garmabi',
        npmUser: 'mohammad.garmabi',
        packages: rows,
        totals: {
          weekly: rows.reduce((sum, row) => sum + row.weekly, 0),
          monthly: rows.reduce((sum, row) => sum + row.monthly, 0),
        },
      },
      null,
      2,
    )}\n`,
  )
  console.log('Wrote', out)
} catch (error) {
  console.warn('npm stats fetch failed — keeping previous snapshot:', error.message)
  if (!existsSync(out)) {
    writeFileSync(
      out,
      `${JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          author: 'Mohammad Garmabi',
          npmUser: 'mohammad.garmabi',
          packages: [],
          totals: { weekly: 0, monthly: 0 },
        },
        null,
        2,
      )}\n`,
    )
  } else {
    // touch-read to ensure file remains
    readFileSync(out)
  }
}
