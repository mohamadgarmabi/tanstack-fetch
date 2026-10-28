<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BlogCard from './BlogCard.vue'
import { BLOG_CATEGORIES } from './blog-types'
import { data as posts } from './posts.data'
import { CATEGORY_META, categoryBySlug } from './blog-utils'

type SortOrder = 'newest' | 'oldest'

const query = ref('')
const activeCategory = ref<string | null>(null)
const activeTags = ref<string[]>([])
const sortOrder = ref<SortOrder>('newest')
const searchInput = ref<HTMLInputElement | null>(null)

const categories = BLOG_CATEGORIES.map((label) => ({
  ...CATEGORY_META[label],
  count: posts.filter((post) => post.category === label).length,
}))

const tagCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const post of posts) {
    if (activeCategory.value && CATEGORY_META[post.category].slug !== activeCategory.value) continue
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([tag, count]) => ({ tag, count }))
})

const normalize = (value: string) => value.toLowerCase().normalize('NFKD')

const filtered = computed(() => {
  const terms = normalize(query.value).split(/\s+/).filter(Boolean)
  const result = posts.filter((post) => {
    if (activeCategory.value && CATEGORY_META[post.category].slug !== activeCategory.value) {
      return false
    }
    if (activeTags.value.some((tag) => !post.tags.includes(tag))) return false
    if (!terms.length) return true
    const haystack = normalize(
      [post.title, post.description, post.category, ...post.tags].join(' '),
    )
    return terms.every((term) => haystack.includes(term))
  })
  return sortOrder.value === 'oldest' ? [...result].reverse() : result
})

const hasFilters = computed(
  () => Boolean(query.value.trim() || activeCategory.value || activeTags.value.length),
)

/** Spotlight the newest post only on the unfiltered view. */
const featured = computed(() =>
  !hasFilters.value && sortOrder.value === 'newest' ? filtered.value[0] : undefined,
)
const gridPosts = computed(() =>
  featured.value ? filtered.value.slice(1) : filtered.value,
)

const activeCategoryMeta = computed(() => categoryBySlug(activeCategory.value))

const selectCategory = (slug: string | null) => {
  activeCategory.value = activeCategory.value === slug ? null : slug
  // Drop tags that no longer exist inside the new category.
  const available = new Set(tagCounts.value.map(({ tag }) => tag))
  activeTags.value = activeTags.value.filter((tag) => available.has(tag))
}

const toggleTag = (tag: string) => {
  activeTags.value = activeTags.value.includes(tag)
    ? activeTags.value.filter((item) => item !== tag)
    : [...activeTags.value, tag]
}

const resetFilters = () => {
  query.value = ''
  activeCategory.value = null
  activeTags.value = []
  sortOrder.value = 'newest'
}

const readUrl = () => {
  const params = new URLSearchParams(window.location.search)
  query.value = params.get('q') ?? ''
  activeCategory.value = categoryBySlug(params.get('category'))?.slug ?? null
  activeTags.value = (params.get('tags') ?? '').split(',').filter(Boolean)
  sortOrder.value = params.get('sort') === 'oldest' ? 'oldest' : 'newest'
}

const writeUrl = () => {
  const params = new URLSearchParams()
  if (query.value.trim()) params.set('q', query.value.trim())
  if (activeCategory.value) params.set('category', activeCategory.value)
  if (activeTags.value.length) params.set('tags', activeTags.value.join(','))
  if (sortOrder.value === 'oldest') params.set('sort', 'oldest')
  const search = params.toString()
  const next = `${window.location.pathname}${search ? `?${search}` : ''}`
  if (next !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(window.history.state, '', next)
  }
}

const focusSearch = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const typing = target?.closest('input, textarea, [contenteditable="true"]')
  if (event.key === '/' && !typing) {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => {
  readUrl()
  watch([query, activeCategory, activeTags, sortOrder], writeUrl)
  window.addEventListener('keydown', focusSearch)
})

onBeforeUnmount(() => window.removeEventListener('keydown', focusSearch))
</script>

<template>
  <div class="blog-hub">
    <header class="blog-hero">
      <p class="blog-eyebrow">The tanstack-fetch blog</p>
      <h1 class="blog-hero-title">
        Typed fetching, <span>one article at a time</span>
      </h1>
      <p class="blog-hero-lead">
        Tutorials, framework deep dives, and release notes about data fetching with TanStack Query
        and <strong>tanstack-fetch</strong>.
      </p>
      <dl class="blog-hero-stats">
        <div>
          <dt>Articles</dt>
          <dd>{{ posts.length }}</dd>
        </div>
        <div v-for="category in categories" :key="category.slug">
          <dt>{{ category.label }}</dt>
          <dd>{{ category.count }}</dd>
        </div>
      </dl>
    </header>

    <section class="blog-controls" aria-label="Filter posts">
      <div class="blog-toolbar">
        <label class="blog-search">
          <span class="visually-hidden">Search posts</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref="searchInput"
            v-model="query"
            type="search"
            placeholder="Search titles, topics, frameworks…"
            autocomplete="off"
          />
          <kbd aria-hidden="true">/</kbd>
        </label>

        <label class="blog-sort">
          <span class="visually-hidden">Sort order</span>
          <select v-model="sortOrder">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      <div class="blog-categories" role="group" aria-label="Categories">
        <button
          type="button"
          class="blog-pill"
          :class="{ 'is-active': !activeCategory }"
          :aria-pressed="!activeCategory"
          @click="selectCategory(null)"
        >
          All <span class="blog-pill-count">{{ posts.length }}</span>
        </button>
        <button
          v-for="category in categories"
          :key="category.slug"
          type="button"
          class="blog-pill"
          :class="[`is-${category.tone}`, { 'is-active': activeCategory === category.slug }]"
          :aria-pressed="activeCategory === category.slug"
          @click="selectCategory(category.slug)"
        >
          <span class="blog-pill-glyph" aria-hidden="true">{{ category.glyph }}</span>
          {{ category.label }}
          <span class="blog-pill-count">{{ category.count }}</span>
        </button>
      </div>

      <div class="blog-tags" role="group" aria-label="Tags">
        <button
          v-for="{ tag, count } in tagCounts"
          :key="tag"
          type="button"
          class="blog-tag"
          :class="{ 'is-active': activeTags.includes(tag) }"
          :aria-pressed="activeTags.includes(tag)"
          @click="toggleTag(tag)"
        >
          #{{ tag }} <span>{{ count }}</span>
        </button>
      </div>

      <p class="blog-result-line" aria-live="polite">
        <span>
          {{ filtered.length }} {{ filtered.length === 1 ? 'post' : 'posts' }}
          <template v-if="activeCategoryMeta"> in <strong>{{ activeCategoryMeta.label }}</strong></template>
          <template v-if="activeTags.length">
            tagged <strong>{{ activeTags.map((tag) => `#${tag}`).join(' + ') }}</strong>
          </template>
        </span>
        <button v-if="hasFilters" type="button" class="blog-reset" @click="resetFilters">
          Clear filters
        </button>
      </p>
      <p v-if="activeCategoryMeta" class="blog-category-blurb">{{ activeCategoryMeta.blurb }}</p>
    </section>

    <BlogCard v-if="featured" :post="featured" featured />

    <TransitionGroup v-if="gridPosts.length" tag="div" name="blog-grid" class="blog-grid">
      <BlogCard v-for="post in gridPosts" :key="post.url" :post="post" />
    </TransitionGroup>

    <div v-else-if="!featured" class="blog-empty">
      <p class="blog-empty-title">No posts match those filters.</p>
      <p>Try a different keyword or remove a tag.</p>
      <button type="button" class="blog-reset" @click="resetFilters">Show all posts</button>
    </div>
  </div>
</template>
