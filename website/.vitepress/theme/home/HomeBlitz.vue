<script setup lang="ts">
import { withBase } from 'vitepress'
import { stackBlitzLinks } from './home.content'
</script>

<template>
  <section class="home-blitz">
    <div class="home-section-head">
      <p class="home-eyebrow">Open in StackBlitz</p>
      <h2>Run the examples in the browser.</h2>
      <p class="home-lead">
        Each link opens the matching folder from the repo. Docs pages stay one click away.
      </p>
    </div>

    <ul>
      <li v-for="item in stackBlitzLinks" :key="item.label">
        <a class="home-blitz-main" :href="item.href" target="_blank" rel="noopener">
          {{ item.label }}
          <span>StackBlitz</span>
        </a>
        <a class="home-blitz-docs" :href="withBase(item.docs)">Docs</a>
      </li>
    </ul>
  </section>
</template>
