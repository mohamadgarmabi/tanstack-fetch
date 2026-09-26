<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import NpmDownloadBadges from './NpmDownloadBadges.vue'
import { useNpmPackageStats } from '../composables/use-npm-stats'

const { pkg } = useNpmPackageStats('tanstack-fetch')
const versionLabel = computed(() => `Featured · v${pkg.value?.version ?? '1.3.0'}`)
</script>

<template>
  <section class="packages-hero-panel" aria-label="Featured package tanstack-fetch">
    <p class="status-playground-eyebrow">{{ versionLabel }}</p>
    <h2 class="packages-featured-title">tanstack-fetch</h2>
    <p>
      Typed Fetch for TanStack Query — <strong>4xx handlers (incl. 429)</strong>, SSR, SSE, upload,
      tRPC.
    </p>
    <NpmDownloadBadges package-name="tanstack-fetch" />
    <div class="npm-card-actions">
      <a class="npm-chip brand" :href="withBase('/guide/getting-started')">Get started</a>
      <a class="npm-chip" :href="withBase('/examples/playground')">Live demos</a>
      <a class="npm-chip" :href="withBase('/guide/configuration')">Configuration</a>
      <a class="npm-chip" :href="withBase('/recipes/rate-limit')">429 rate limit</a>
      <a
        class="npm-chip"
        href="https://www.npmjs.com/package/tanstack-fetch"
        target="_blank"
        rel="noopener"
        >npm</a
      >
    </div>
  </section>
</template>
