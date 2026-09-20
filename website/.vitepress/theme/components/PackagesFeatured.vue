<script setup lang="ts">
import { withBase } from 'vitepress'
import NpmDownloadBadges from './NpmDownloadBadges.vue'
</script>

<template>
  <section class="packages-hero-panel" aria-label="Featured package tanstack-fetch">
    <p class="status-playground-eyebrow">Featured · v1.2</p>
    <h2 class="packages-featured-title">tanstack-fetch</h2>
    <p>
      Typed Fetch for TanStack Query — <strong>4xx handlers (incl. 429)</strong>, SSR, SSE,
      upload, tRPC.
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
