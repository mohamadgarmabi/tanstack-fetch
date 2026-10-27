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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} → ${response.status}`)
  return response.json()
}

// npm's `last-week` / `last-month` aliases can lag months behind (returning 0),
// so request explicit ranges ending yesterday (UTC) instead.
const downloadsRange = (days) => {
  const day = 24 * 60 * 60 * 1000
  const end = new Date(Date.now() - day)
  const start = new Date(end.getTime() - (days - 1) * day)
  const format = (date) => date.toISOString().slice(0, 10)
  return `${format(start)}:${format(end)}`
}

const fetchPackage = async (name) => {
  let attempt = 0
  for (;;) {
    try {
      const [weekly, monthly, meta] = await Promise.all([
        fetchJson(`https://api.npmjs.org/downloads/point/${downloadsRange(7)}/${name}`),
        fetchJson(`https://api.npmjs.org/downloads/point/${downloadsRange(30)}/${name}`),
        fetchJson(`https://registry.npmjs.org/${name}`),
      ])
      return {
        name,
        version: meta['dist-tags']?.latest ?? '?',
        weekly: weekly.downloads ?? 0,
        monthly: monthly.downloads ?? 0,
        description: String(meta.description ?? '').slice(0, 120),
      }
    } catch (error) {
      attempt += 1
      if (attempt > 5) throw error
      await sleep(1500 * attempt)
    }
  }
}

try {
  const rows = []
  for (const name of packages) {
    const row = await fetchPackage(name)
    rows.push(row)
    console.log(`${name} week=${row.weekly} month=${row.monthly}`)
    await sleep(350)
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
    readFileSync(out)
  }
}

// GitHub stars snapshot — the site fetches live stars too; this is the offline fallback.
const githubOut = join(root, 'data', 'github-repo.json')
const githubRepo = 'mohamadgarmabi/tanstack-fetch'

try {
  const repo = await fetchJson(`https://api.github.com/repos/${githubRepo}`)
  writeFileSync(
    githubOut,
    `${JSON.stringify(
      {
        repo: githubRepo,
        stars: repo.stargazers_count ?? null,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  )
  console.log(`${githubRepo} stars=${repo.stargazers_count}`)
} catch (error) {
  console.warn('GitHub stars fetch failed — keeping previous snapshot:', error.message)
  if (!existsSync(githubOut)) {
    writeFileSync(
      githubOut,
      `${JSON.stringify({ repo: githubRepo, stars: null, updatedAt: null }, null, 2)}\n`,
    )
  }
}
