<script setup lang="ts">
import { testimonials } from './home.content'
import HomeIcon, { type HomeIconName } from './HomeIcon.vue'

const SOCIAL_ICONS: HomeIconName[] = ['query', 'layers', 'feather']
</script>

<template>
  <section class="home-social">
    <div class="home-section-head">
      <p class="home-eyebrow">Built for</p>
      <h2>Who this client is for.</h2>
    </div>

    <ul>
      <li v-for="(item, index) in testimonials" :key="item.author" class="fx-spotlight">
        <span class="home-card-icon"><HomeIcon :name="SOCIAL_ICONS[index] ?? 'users'" /></span>
        <p>{{ item.quote }}</p>
        <strong>{{ item.author }}</strong>
        <span>{{ item.role }}</span>
      </li>
    </ul>
  </section>
</template>
