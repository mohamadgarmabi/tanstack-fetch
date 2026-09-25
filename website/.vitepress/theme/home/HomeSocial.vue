<script setup lang="ts">
import { testimonials } from './home.content'
</script>

<template>
  <section class="home-social">
    <div class="home-section-head">
      <p class="home-eyebrow">Built for</p>
      <h2>Who this client is for.</h2>
    </div>

    <ul>
      <li v-for="item in testimonials" :key="item.author">
        <p>{{ item.quote }}</p>
        <strong>{{ item.author }}</strong>
        <span>{{ item.role }}</span>
      </li>
    </ul>
  </section>
</template>
