<script setup lang="ts">
import { withBase } from 'vitepress'
import { CHANGELOG_URL, NPM_URL, PACKAGE_VERSION, integrations, runtimes } from './home.content'
import LiquidGlass from '../components/glass/LiquidGlass.vue'
import HomeIcon, { type HomeIconName } from './HomeIcon.vue'

const toHref = (href: string) => (href.startsWith('http') ? href : withBase(href))

// Downloads live in the hero; the band covers footprint and reach.
const stats: { value: string; label: string; href: string; icon: HomeIconName }[] = [
  {
    value: '4.81KB',
    label: 'gzip HTTP core',
    href: 'https://bundlephobia.com/package/tanstack-fetch',
    icon: 'feather',
  },
  { value: '0', label: 'runtime dependencies', href: NPM_URL, icon: 'layers' },
  { value: '8', label: 'frameworks supported', href: '/docs', icon: 'atom' },
  { value: `v${PACKAGE_VERSION}`, label: 'current release', href: CHANGELOG_URL, icon: 'bolt' },
]
</script>

<template>
  <section class="home-band">
    <ul class="home-stats">
      <LiquidGlass
        v-for="stat in stats"
        :key="stat.label"
        as="li"
        :radius="16"
        :scale="-60"
        :g-offset="4"
        :b-offset="8"
      >
        <a
          :href="toHref(stat.href)"
          :target="stat.href.startsWith('http') ? '_blank' : undefined"
          rel="noopener"
        >
          <span class="home-stat-icon"><HomeIcon :name="stat.icon" /></span>
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </a>
      </LiquidGlass>
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
