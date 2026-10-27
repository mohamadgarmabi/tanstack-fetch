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
const badgesDir = join(root, 'public', 'badges')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchJson = async (url) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} → ${response.status}`)
  return response.json()
}

// npm's `last-week` / `last-month` aliases can lag months behind (returning 0),
// so request explicit ranges ending yesterday (UTC) instead.
const DAY = 24 * 60 * 60 * 1000

const formatDay = (date) => date.toISOString().slice(0, 10)

const downloadsRange = (days) => {
  const end = new Date(Date.now() - DAY)
  const start = new Date(end.getTime() - (days - 1) * DAY)
  return `${formatDay(start)}:${formatDay(end)}`
}

// The point API caps a range at 18 months, so sum all-time downloads in chunks.
const fetchTotalDownloads = async (name, createdAt) => {
  const end = Date.now() - DAY
  const chunk = 500 * DAY
  let total = 0
  for (let start = new Date(createdAt).getTime(); start <= end; start += chunk) {
    const stop = Math.min(start + chunk - DAY, end)
    const point = await fetchJson(
      `https://api.npmjs.org/downloads/point/${formatDay(new Date(start))}:${formatDay(new Date(stop))}/${name}`,
    )
    total += point.downloads ?? 0
  }
  return total
}

const formatCount = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return value.toLocaleString('en-US')
}

// shields.io endpoint badges for the README — shields' own npm download
// badges read the stale aliases too. Served from GitHub Pages under /badges.
const writeBadges = (row) => {
  const badges = {
    dw: { label: 'downloads', message: `${formatCount(row.weekly)}/week` },
    dm: { label: 'downloads', message: `${formatCount(row.monthly)}/month` },
    dt: { label: 'downloads', message: formatCount(row.total) },
  }
  mkdirSync(badgesDir, { recursive: true })
  for (const [kind, badge] of Object.entries(badges)) {
    writeFileSync(
      join(badgesDir, `${row.name}-${kind}.json`),
      `${JSON.stringify({ schemaVersion: 1, ...badge, color: 'brightgreen' })}\n`,
    )
  }
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
        total: await fetchTotalDownloads(name, meta.time?.created ?? '2015-01-10'),
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
    writeBadges(row)
    console.log(`${name} week=${row.weekly} month=${row.monthly} total=${row.total}`)
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
