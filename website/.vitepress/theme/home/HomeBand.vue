<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { CHANGELOG_URL, NPM_URL, integrations, runtimes } from './home.content'
import { formatCount, useNpmPackageStats } from '../composables/use-npm-stats'

const { pkg } = useNpmPackageStats('tanstack-fetch')

const toHref = (href: string) => (href.startsWith('http') ? href : withBase(href))

const stats = computed(() => [
  {
    value: '~3.5KB',
    label: 'gzip HTTP core',
    href: 'https://bundlephobia.com/package/tanstack-fetch',
  },
  {
    value: formatCount(pkg.value?.weekly ?? 0),
    label: 'downloads / week',
    href: NPM_URL,
  },
  {
    value: formatCount(pkg.value?.monthly ?? 0),
    label: 'downloads / month',
    href: NPM_URL,
  },
  {
    value: `v${pkg.value?.version ?? '1.3.0'}`,
    label: 'current release',
    href: CHANGELOG_URL,
  },
])
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
