<script setup lang="ts">
import { withBase } from 'vitepress'
import { packages } from './home.content'
</script>

<template>
  <section class="home-packages">
    <div class="home-section-head">
      <p class="home-eyebrow">Entry points</p>
      <h2>Import only the piece you call.</h2>
      <p class="home-lead">
        None of these are required on day one. Add an entry when the feature shows up.
      </p>
    </div>

    <ul>
      <li v-for="item in packages" :key="item.spec">
        <a :href="withBase(item.href)">
          <div>
            <h3>{{ item.title }}</h3>
            <code>{{ item.spec }}</code>
          </div>
          <p>{{ item.text }}</p>
          <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>
