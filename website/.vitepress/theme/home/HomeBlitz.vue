<script setup lang="ts">
import { withBase } from 'vitepress'
import { stackBlitzLinks } from './home.content'
</script>

<template>
  <section class="home-blitz">
    <div class="home-section-head">
      <p class="home-eyebrow">Open in StackBlitz · v1.7.0</p>
      <h2>Run the examples in the browser.</h2>
      <p class="home-lead">
        StackBlitz for React demos (Query, Next.js, SSE, tRPC, upload). Docs cover the same
        <code>api.sse</code> / <code>createTRPCFetchClient</code> patterns on Vue, Nuxt, Solid,
        Angular, Svelte, and SvelteKit.
      </p>
    </div>

    <ul>
      <li v-for="item in stackBlitzLinks" :key="item.label">
        <a
          v-if="item.href"
          class="home-blitz-main"
          :href="item.href"
          target="_blank"
          rel="noopener"
        >
          {{ item.label }}
          <span>StackBlitz</span>
        </a>
        <a v-else class="home-blitz-main" :href="withBase(item.docs)">
          {{ item.label }}
          <span>Docs</span>
        </a>
        <a v-if="item.href" class="home-blitz-docs" :href="withBase(item.docs)">Docs</a>
      </li>
    </ul>
  </section>
</template>
