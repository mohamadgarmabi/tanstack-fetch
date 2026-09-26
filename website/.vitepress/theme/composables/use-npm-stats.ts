import { computed, onMounted, ref, shallowRef } from 'vue'
import fallback from '../../../data/npm-packages.json'

type NpmPackageRow = {
  name: string
  version: string
  weekly: number
  monthly: number
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
}

const snapshot = fallback as NpmPackagesSnapshot

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} → ${response.status}`)
  }
  return response.json() as Promise<T>
}

const fetchPackageRow = async (pkg: NpmPackageRow): Promise<NpmPackageRow> => {
  const [weekly, monthly, meta] = await Promise.all([
    fetchJson<DownloadsPoint>(`https://api.npmjs.org/downloads/point/last-week/${pkg.name}`),
    fetchJson<DownloadsPoint>(`https://api.npmjs.org/downloads/point/last-month/${pkg.name}`),
    fetchJson<RegistryMeta>(`https://registry.npmjs.org/${pkg.name}`),
  ])

  return {
    name: pkg.name,
    version: meta['dist-tags']?.latest ?? pkg.version,
    weekly: weekly.downloads ?? pkg.weekly,
    monthly: monthly.downloads ?? pkg.monthly,
    description: String(meta.description ?? pkg.description).slice(0, 120),
  }
}

const useNpmPackages = () => {
  const data = shallowRef<NpmPackagesSnapshot>(snapshot)
  const loading = ref(false)
  const live = ref(false)
  const error = ref<string | null>(null)

  const refresh = async () => {
    if (typeof window === 'undefined') return

    loading.value = true
    error.value = null

    try {
      const packages = await Promise.all(snapshot.packages.map((pkg) => fetchPackageRow(pkg)))

      data.value = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
        packages,
        totals: {
          weekly: packages.reduce((sum, row) => sum + row.weekly, 0),
          monthly: packages.reduce((sum, row) => sum + row.monthly, 0),
        },
      }
      live.value = true
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

export { useNpmPackages, useNpmPackageStats, formatCount, formatUpdatedAt }
export type { NpmPackageRow, NpmPackagesSnapshot }
