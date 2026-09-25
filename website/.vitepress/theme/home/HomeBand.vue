<script setup lang="ts">
import { withBase } from 'vitepress'
import { integrations, runtimes, stats } from './home.content'

const toHref = (href: string) => (href.startsWith('http') ? href : withBase(href))
</script>

<template>
  <section class="home-band">
    <ul class="home-stats">
      <li v-for="stat in stats" :key="stat.label">
        <a v-if="stat.href" :href="toHref(stat.href)" target="_blank" rel="noopener">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </a>
        <template v-else>
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </template>
      </li>
    </ul>

    <div class="home-pills">
      <p>Runs on</p>
      <ul>
        <li v-for="item in runtimes" :key="item.label">
          <a :href="toHref(item.href)">{{ item.label }}</a>
        </li>
      </ul>
    </div>

    <div class="home-pills">
      <p>Works with</p>
      <ul>
        <li v-for="item in integrations" :key="item.label">
          <a :href="toHref(item.href)">{{ item.label }}</a>
        </li>
      </ul>
    </div>
  </section>
</template>
