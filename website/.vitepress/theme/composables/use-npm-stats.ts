import { onMounted, ref, shallowRef } from 'vue'
import fallback from '../../../data/npm-packages.json'

type NpmPackageRow = {
  name: string
  version: string
  weekly: number
  monthly: number
  total?: number
  description: string
}

type NpmPackagesSnapshot = {
  updatedAt: string
  author: string
  npmUser: string
  packages: NpmPackageRow[]
  totals: {
    weekly: number
    monthly: number
  }
}

type DownloadsPoint = {
  downloads?: number
}

type RegistryMeta = {
  description?: string
  'dist-tags'?: {
    latest?: string
  }
  time?: {
    created?: string
  }
}

const snapshot = fallback as NpmPackagesSnapshot

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`${url} → ${response.status}`)
  }
  return response.json() as Promise<T>
}

const compareSemver = (left: string, right: string) => {
  const leftParts = left.split('.').map((part) => Number(part) || 0)
  const rightParts = right.split('.').map((part) => Number(part) || 0)
  for (let index = 0; index < 3; index += 1) {
    const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (delta !== 0) return delta
  }
  return 0
}

const sumTotals = (packages: NpmPackageRow[]) => ({
  weekly: packages.reduce((sum, row) => sum + row.weekly, 0),
  monthly: packages.reduce((sum, row) => sum + row.monthly, 0),
})

// npm's `last-week` / `last-month` aliases can lag months behind (returning 0),
// so request explicit ranges ending yesterday (UTC) instead.
const DAY = 24 * 60 * 60 * 1000

const formatDay = (date: Date) => date.toISOString().slice(0, 10)

const downloadsRange = (days: number) => {
  const end = new Date(Date.now() - DAY)
  const start = new Date(end.getTime() - (days - 1) * DAY)
  return `${formatDay(start)}:${formatDay(end)}`
}

// The point API caps a range at 18 months, so sum all-time downloads in chunks.
const fetchTotalDownloads = async (name: string, createdAt: string) => {
  const end = Date.now() - DAY
  const chunk = 500 * DAY
  const requests: Promise<DownloadsPoint>[] = []
  for (let start = new Date(createdAt).getTime(); start <= end; start += chunk) {
    const stop = Math.min(start + chunk - DAY, end)
    requests.push(
      fetchJson<DownloadsPoint>(
        `https://api.npmjs.org/downloads/point/${formatDay(new Date(start))}:${formatDay(new Date(stop))}/${name}`,
      ),
    )
  }
  const points = await Promise.all(requests)
  return points.reduce((sum, point) => sum + (point.downloads ?? 0), 0)
}

const fetchPackageRow = async (pkg: NpmPackageRow): Promise<NpmPackageRow> => {
  const weeklyPromise = fetchJson<DownloadsPoint>(
    `https://api.npmjs.org/downloads/point/${downloadsRange(7)}/${pkg.name}`,
  )
  const monthlyPromise = fetchJson<DownloadsPoint>(
    `https://api.npmjs.org/downloads/point/${downloadsRange(30)}/${pkg.name}`,
  )
  const metaPromise = fetchJson<RegistryMeta>(`https://registry.npmjs.org/${pkg.name}`).catch(
    () => null,
  )

  const [weekly, monthly, meta] = await Promise.all([weeklyPromise, monthlyPromise, metaPromise])

  const registryLatest = meta?.['dist-tags']?.latest ?? pkg.version
  const version = compareSemver(pkg.version, registryLatest) > 0 ? pkg.version : registryLatest
  const createdAt = meta?.time?.created
  const total = createdAt
    ? await fetchTotalDownloads(pkg.name, createdAt).catch(() => pkg.total)
    : pkg.total

  return {
    name: pkg.name,
    version,
    weekly: weekly.downloads ?? pkg.weekly,
    monthly: monthly.downloads ?? pkg.monthly,
    total,
    description: String(meta?.description ?? pkg.description).slice(0, 120),
  }
}

const useNpmPackages = () => {
  const data = shallowRef<NpmPackagesSnapshot>({
    ...snapshot,
    totals: sumTotals(snapshot.packages),
  })
  const loading = ref(false)
  const live = ref(false)
  const error = ref<string | null>(null)

  const refresh = async () => {
    if (typeof window === 'undefined') return

    loading.value = true
    error.value = null

    try {
      const results = await Promise.allSettled(snapshot.packages.map((pkg) => fetchPackageRow(pkg)))
      const packages = results.map((result, index) => {
        if (result.status === 'fulfilled') return result.value
        return snapshot.packages[index]
      })
      const failed = results.filter((result) => result.status === 'rejected').length

      data.value = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
        packages,
        totals: sumTotals(packages),
      }
      live.value = failed < results.length
      if (failed > 0) {
        error.value = `Updated ${results.length - failed}/${results.length} packages from npm`
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refresh npm stats'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void refresh()
  })

  return { data, loading, live, error, refresh }
}

const useNpmPackageStats = (packageName: string) => {
  const fallbackPkg = snapshot.packages.find((item) => item.name === packageName) ?? null
  const pkg = shallowRef<NpmPackageRow | null>(fallbackPkg)
  const loading = ref(false)
  const live = ref(false)

  const refresh = async () => {
    if (typeof window === 'undefined' || !fallbackPkg) return

    loading.value = true
    try {
      pkg.value = await fetchPackageRow(fallbackPkg)
      live.value = true
    } catch {
      // keep snapshot fallback
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void refresh()
  })

  return { pkg, loading, live, refresh }
}

const formatCount = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return value.toLocaleString('en-US')
}

// Static shields.io badge built from our own numbers — shields' `npm/dw|dm|dt`
// badges rely on the same stale npm aliases and show 0.
const countBadgeUrl = (label: string, value: number, color: string, style = '') => {
  const escape = (text: string) => encodeURIComponent(text.replace(/-/g, '--').replace(/_/g, '__'))
  const query = style ? `?style=${style}` : ''
  return `https://img.shields.io/badge/${escape(label)}-${escape(formatCount(value))}-${color}${query}`
}

const formatUpdatedAt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export { useNpmPackages, useNpmPackageStats, formatCount, formatUpdatedAt, countBadgeUrl }
export type { NpmPackageRow, NpmPackagesSnapshot }
