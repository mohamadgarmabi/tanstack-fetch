<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'
import { CHANGELOG_URL, GITHUB_URL, INSTALL_COMMAND } from './home.content'

const copied = ref(false)

const copyInstall = async () => {
  await navigator.clipboard.writeText(INSTALL_COMMAND)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <header class="home-hero">
    <a class="home-badge" :href="CHANGELOG_URL" target="_blank" rel="noopener">
      <span>v1.3.0</span>
      Changelog on GitHub
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M6 3h7v7M13 3 3 13" />
      </svg>
    </a>

    <h1>Typed fetch,<br />made simple.</h1>

    <p class="home-hero-lead">
      Write the request once. tanstack-fetch returns the data, throws a typed error, and honors
      AbortSignal, so it drops straight into TanStack Query. SSR, SSE, upload, refresh-token, and
      tRPC stay optional.
    </p>

    <div class="home-actions">
      <a class="home-btn home-btn-primary" :href="withBase('/guide/getting-started')">
        Get started
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
      </a>
      <a class="home-btn" :href="withBase('/examples/playground')">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4.5v7l6-3.5-6-3.5z" /></svg>
        Playground
      </a>
      <a class="home-btn" :href="GITHUB_URL" target="_blank" rel="noopener">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.5a6.5 6.5 0 0 0-2.05 12.66c.32.06.44-.14.44-.31v-1.08c-1.78.39-2.16-.86-2.16-.86-.29-.73-.7-.93-.7-.93-.57-.39.05-.38.05-.38.63.04.96.65.96.65.56.96 1.47.68 1.83.52.06-.41.22-.68.4-.84-1.42-.16-2.91-.71-2.91-3.16 0-.7.25-1.27.66-1.72-.07-.16-.29-.81.06-1.69 0 0 .54-.17 1.77.66a6.1 6.1 0 0 1 3.22 0c1.23-.83 1.77-.66 1.77-.66.35.88.13 1.53.06 1.69.41.45.66 1.02.66 1.72 0 2.46-1.5 3-2.93 3.15.23.2.44.59.44 1.19v1.77c0 .17.12.37.44.31A6.5 6.5 0 0 0 8 1.5z"
          />
        </svg>
        GitHub
      </a>
    </div>

    <button class="home-install" type="button" @click="copyInstall">
      <span class="home-install-prompt">$</span>
      <code>{{ INSTALL_COMMAND }}</code>
      <span class="home-install-copy">{{ copied ? 'Copied' : 'Copy' }}</span>
    </button>
  </header>
</template>
