<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import BlogCard from './BlogCard.vue'
import { data as posts } from './posts.data'
import { findPost, relatedPosts } from './blog-utils'

const { page } = useData()

const related = computed(() => {
  const current = findPost(posts, page.value.relativePath)
  return current ? relatedPosts(posts, current) : []
})
</script>

<template>
  <section v-if="related.length" class="blog-related" aria-labelledby="blog-related-title">
    <div class="blog-related-head">
      <h2 id="blog-related-title">Keep reading</h2>
      <a :href="withBase('/blog/')">Browse all posts →</a>
    </div>
    <div class="blog-grid is-compact">
      <BlogCard v-for="post in related" :key="post.url" :post="post" />
    </div>
  </section>
</template>
