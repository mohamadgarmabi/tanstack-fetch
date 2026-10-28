<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as posts } from './posts.data'
import { CATEGORY_META, findPost, formatDate } from './blog-utils'

const { page } = useData()

const post = computed(() => findPost(posts, page.value.relativePath))
const meta = computed(() => (post.value ? CATEGORY_META[post.value.category] : undefined))
</script>

<template>
  <nav v-if="post && meta" class="blog-post-header" :class="`is-${meta.tone}`" aria-label="Post">
    <a class="blog-post-back" :href="withBase('/blog/')">
      <span aria-hidden="true">←</span> All posts
    </a>
    <a class="blog-badge" :href="withBase(`/blog/?category=${meta.slug}`)">{{ meta.label }}</a>
    <span class="blog-post-facts">
      <time :datetime="post.date">{{ formatDate(post.date) }}</time>
      <span aria-hidden="true">·</span>
      {{ post.readingMinutes }} min read
    </span>
    <span v-if="post.tags.length" class="blog-post-tags">
      <a v-for="tag in post.tags" :key="tag" :href="withBase(`/blog/?tags=${encodeURIComponent(tag)}`)">
        #{{ tag }}
      </a>
    </span>
  </nav>
</template>
