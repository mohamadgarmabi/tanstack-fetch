export const BLOG_CATEGORIES = ['Tutorials', 'Framework guides', 'Releases'] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export interface BlogPost {
  url: string
  title: string
  description: string
  /** ISO day, e.g. `2026-10-28`. */
  date: string
  category: BlogCategory
  tags: string[]
  cover?: string
  readingMinutes: number
}
