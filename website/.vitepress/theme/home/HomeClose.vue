<script setup lang="ts">
import { withBase } from 'vitepress'
import { AUTHOR_URL, footerColumns, GITHUB_URL, LINKEDIN_URL } from './home.content'

const toHref = (href: string) => (href.startsWith('http') ? href : withBase(href))
</script>

<template>
  <section class="home-close">
    <h2>Start with one request.</h2>
    <p>
      Add a token when you need auth, a plugin when you need retry, another entry when you need SSE.
      The queryFn does not change. The first call is a few lines.
    </p>
    <div class="home-actions">
      <a class="home-btn home-btn-primary" :href="withBase('/guide/getting-started')">
        Get started
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
      </a>
      <a class="home-btn" :href="withBase('/examples/playground')">Playground</a>
      <a class="home-btn" :href="GITHUB_URL" target="_blank" rel="noopener">GitHub</a>
    </div>
  </section>

  <footer class="home-footer">
    <div class="home-footer-brand">
      <strong>tanstack-fetch</strong>
      <p>Typed fetch for TanStack Query. Built in the open by Mohammad Garmabi.</p>
      <p class="home-footer-note">Not an official TanStack package.</p>
    </div>

    <div class="home-footer-grid">
      <div v-for="column in footerColumns" :key="column.title">
        <h2>{{ column.title }}</h2>
        <ul>
          <li v-for="link in column.links" :key="link.label">
            <a :href="toHref(link.href)">{{ link.label }}</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="home-footer-bar">
      <p>© {{ new Date().getFullYear() }} Mohammad Garmabi</p>
      <p>
        <a :href="AUTHOR_URL" target="_blank" rel="noopener">GitHub</a>
        <a :href="LINKEDIN_URL" target="_blank" rel="noopener">LinkedIn</a>
        <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener">MIT License</a>
      </p>
    </div>
  </footer>
</template>
