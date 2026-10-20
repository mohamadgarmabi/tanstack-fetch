<script setup lang="ts">
import { withBase } from 'vitepress'
import { whyAxios } from './home.content'
import HomeIcon, { type HomeIconName } from './HomeIcon.vue'

const WHY_ICONS: HomeIconName[] = ['query', 'server', 'stream']
</script>

<template>
  <section class="home-why">
    <div class="home-section-head">
      <p class="home-eyebrow">Why not axios?</p>
      <h2>Same job. Query-shaped answer.</h2>
      <p class="home-lead">
        axios, ky, and ofetch are solid HTTP clients. tanstack-fetch is shaped for the call site
        TanStack Query already expects.
      </p>
    </div>

    <ul>
      <li v-for="(item, index) in whyAxios" :key="item.title" class="fx-spotlight">
        <span class="home-card-icon"><HomeIcon :name="WHY_ICONS[index] ?? 'bolt'" /></span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.text }}</p>
      </li>
    </ul>

    <p class="home-why-link">
      <a :href="withBase('/guide/comparison')">
        Read the full comparison <HomeIcon name="arrow" />
      </a>
    </p>
  </section>
</template>
