<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { BlogPost } from './blog-types'
import { CATEGORY_META, formatDate } from './blog-utils'

const props = defineProps<{ post: BlogPost; featured?: boolean }>()

const meta = computed(() => CATEGORY_META[props.post.category])
</script>

<template>
  <article
    class="blog-card"
    :class="[`is-${meta.tone}`, { 'is-featured': featured }]"
  >
    <a class="blog-card-link" :href="withBase(post.url)" :aria-label="post.title">
      <div class="blog-card-media">
        <img
          v-if="post.cover"
          :src="withBase(post.cover)"
          :alt="''"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="blog-card-art" aria-hidden="true">
          <span class="blog-card-art-glyph">{{ meta.glyph }}</span>
          <span class="blog-card-art-tags">
            <span v-for="tag in post.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
          </span>
        </div>
        <span class="blog-badge">{{ meta.label }}</span>
      </div>

      <div class="blog-card-body">
        <p class="blog-card-meta">
          <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          <span aria-hidden="true">·</span>
          <span>{{ post.readingMinutes }} min read</span>
        </p>
        <h3 class="blog-card-title">{{ post.title }}</h3>
        <p class="blog-card-desc">{{ post.description }}</p>
        <ul v-if="post.tags.length" class="blog-card-tags" aria-label="Tags">
          <li v-for="tag in post.tags" :key="tag">#{{ tag }}</li>
        </ul>
        <span class="blog-card-cta">Read the post <span aria-hidden="true">→</span></span>
      </div>
    </a>
  </article>
</template>
