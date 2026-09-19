<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <div class="home-intro">
    <p class="home-intro-center">
      <img
        class="brand-logo-hero"
        :src="withBase('/images/logo.jpg')"
        alt="tanstack-fetch logo"
        width="180"
        height="180"
      />
    </p>

    <p class="home-intro-center">
      <img
        class="hero-gif"
        :src="withBase('/images/tanstack-fetch-hero.gif')"
        alt="tanstack-fetch by Mohammad Garmabi — createFetch + TanStack Query demo"
        width="720"
        height="456"
      />
    </p>

    <p class="home-intro-center home-meta-links">
      Created by
      <strong>
        <a :href="withBase('/author')">Mohammad Garmabi</a>
      </strong>
      ·
      <a href="https://www.npmjs.com/package/tanstack-fetch" target="_blank" rel="noopener">npm</a>
      ·
      <a href="https://github.com/mohamadgarmabi/tanstack-fetch" target="_blank" rel="noopener">GitHub</a>
      ·
      <a href="https://www.linkedin.com/in/mohammad-garmabi/" target="_blank" rel="noopener me">LinkedIn</a>
    </p>
  </div>
</template>
