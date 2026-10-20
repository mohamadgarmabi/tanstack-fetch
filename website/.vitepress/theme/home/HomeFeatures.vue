<script setup lang="ts">
import { features } from './home.content'
import HomeIcon, { type HomeIconName } from './HomeIcon.vue'

const ICON_BY_FEATURE: Record<string, HomeIconName> = {
  'Query-shaped client': 'query',
  'Typed FetchError': 'error',
  'Status handlers': 'shield',
  'Refresh on 401': 'refresh',
  'Request DevTools': 'devtools',
  '4.81KB HTTP core': 'feather',
  Plugins: 'plug',
  'SSR forwarding': 'server',
  'SSE with auth': 'stream',
  'Upload progress': 'upload',
  'tRPC link': 'link',
  'OpenAPI codegen': 'code',
  'React helpers': 'atom',
  'Vue & Nuxt helpers': 'triangle',
}
</script>

<template>
  <section class="home-features">
    <div class="home-section-head">
      <p class="home-eyebrow">Features</p>
      <h2>Everything a queryFn client needs.</h2>
    </div>

    <ul>
      <li v-for="feature in features" :key="feature.title" class="fx-spotlight">
        <span class="home-card-icon">
          <HomeIcon :name="ICON_BY_FEATURE[feature.title] ?? 'bolt'" />
        </span>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.text }}</p>
      </li>
    </ul>
  </section>
</template>
