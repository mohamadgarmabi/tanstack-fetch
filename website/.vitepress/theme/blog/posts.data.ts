import { createContentLoader } from 'vitepress'
import { BLOG_CATEGORIES, type BlogPost } from './blog-types'

// Data loaders may only export `data`; shared types live in `blog-types.ts`.

declare const data: BlogPost[]
export { data }

const WORDS_PER_MINUTE = 220

/** Strip frontmatter, fenced code, and markup so reading time tracks prose. */
const countWords = (src: string) =>
  src
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length

const toIsoDay = (value: unknown) => {
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? '1970-01-01' : date.toISOString().slice(0, 10)
}

const cleanTitle = (title: string) => title.replace(/\s+\|.*$/, '')

export default createContentLoader('blog/*.md', {
  includeSrc: true,
  transform: (raw): BlogPost[] =>
    raw
      .filter(({ url, frontmatter }) => !url.endsWith('/blog/') && !frontmatter.hidden)
      .map(({ url, frontmatter, src }) => ({
        url,
        title: cleanTitle(String(frontmatter.title ?? url)),
        description: String(frontmatter.description ?? ''),
        date: toIsoDay(frontmatter.date),
        category: BLOG_CATEGORIES.includes(frontmatter.category)
          ? frontmatter.category
          : 'Tutorials',
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
        cover: frontmatter.cover ? String(frontmatter.cover) : undefined,
        readingMinutes: Math.max(1, Math.round(countWords(src ?? '') / WORDS_PER_MINUTE)),
      }))
      .sort((left, right) => right.date.localeCompare(left.date) || left.title.localeCompare(right.title)),
})
