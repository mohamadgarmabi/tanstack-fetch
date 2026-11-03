import { onMounted, ref } from 'vue'
import fallback from '../../../data/github-repo.json'

type RepoSnapshot = {
  repo: string
  stars: number | null
  updatedAt: string | null
}

type RepoResponse = {
  stargazers_count?: number
}

const snapshot = fallback as RepoSnapshot

// Unauthenticated GitHub API calls are capped at 60/hour per IP — cache per visitor.
const CACHE_KEY = 'tanstack-fetch:github-stars'
const CACHE_TTL_MS = 60 * 60 * 1000

const readCache = (): number | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { stars, at } = JSON.parse(raw) as { stars: unknown; at: number }
    return typeof stars === 'number' && Date.now() - at < CACHE_TTL_MS ? stars : null
  } catch {
    return null
  }
}

const writeCache = (stars: number) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ stars, at: Date.now() }))
  } catch {
    // storage blocked — the next visit simply refetches
  }
}

/** Live star count for the repo; falls back to the prebuild snapshot (or `null` = unknown). */
const useGithubStars = () => {
  const stars = ref<number | null>(snapshot.stars)
  const live = ref(false)

  onMounted(async () => {
    const cached = readCache()
    if (cached !== null) {
      stars.value = cached
      live.value = true
      return
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${snapshot.repo}`, {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!response.ok) return
      const body = (await response.json()) as RepoResponse
      if (typeof body.stargazers_count !== 'number') return
      stars.value = body.stargazers_count
      live.value = true
      writeCache(body.stargazers_count)
    } catch {
      // offline or rate-limited — keep the snapshot
    }
  })

  return { stars, live, repo: snapshot.repo }
}

export { useGithubStars }
