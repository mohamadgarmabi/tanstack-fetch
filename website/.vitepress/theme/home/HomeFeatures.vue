<script setup lang="ts">
import { features } from './home.content'
</script>

<template>
  <section class="home-features">
    <div class="home-section-head">
      <p class="home-eyebrow">Features</p>
      <h2>Everything a queryFn client needs.</h2>
    </div>

    <ul>
      <li v-for="feature in features" :key="feature.title">
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.text }}</p>
      </li>
    </ul>
  </section>
</template>
