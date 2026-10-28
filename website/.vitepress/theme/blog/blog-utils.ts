import type { BlogCategory, BlogPost } from './blog-types'

export interface CategoryMeta {
  slug: string
  label: BlogCategory
  blurb: string
  /** CSS class suffix — accent colors live in `blog.css`. */
  tone: 'tutorial' | 'framework' | 'release'
  glyph: string
}

export const CATEGORY_META: Record<BlogCategory, CategoryMeta> = {
  Tutorials: {
    slug: 'tutorials',
    label: 'Tutorials',
    blurb: 'Step-by-step builds with the TanStack ecosystem.',
    tone: 'tutorial',
    glyph: '◆',
  },
  'Framework guides': {
    slug: 'frameworks',
    label: 'Framework guides',
    blurb: 'Deep dives per stack — React, Vue, Solid, Angular, Svelte.',
    tone: 'framework',
    glyph: '▲',
  },
  Releases: {
    slug: 'releases',
    label: 'Releases',
    blurb: 'What shipped in each tanstack-fetch version.',
    tone: 'release',
    glyph: '●',
  },
}

export const categoryBySlug = (slug: string | null) =>
  Object.values(CATEGORY_META).find((meta) => meta.slug === slug)

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/** UTC formatting keeps SSR output and hydration identical. */
export const formatDate = (isoDay: string) => DATE_FORMAT.format(new Date(`${isoDay}T00:00:00Z`))

export const pagePathToUrl = (relativePath: string) => `/${relativePath.replace(/\.md$/, '')}`

export const findPost = (posts: BlogPost[], relativePath: string) => {
  const url = pagePathToUrl(relativePath)
  return posts.find((post) => post.url === url || post.url === `${url}.html`)
}

/** Same category first, then shared tags, newest wins ties. */
export const relatedPosts = (posts: BlogPost[], current: BlogPost, limit = 3) =>
  posts
    .filter((post) => post.url !== current.url)
    .map((post) => ({
      post,
      score:
        (post.category === current.category ? 2 : 0) +
        post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || right.post.date.localeCompare(left.post.date))
    .slice(0, limit)
    .map(({ post }) => post)
