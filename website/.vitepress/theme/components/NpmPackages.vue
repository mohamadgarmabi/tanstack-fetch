<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import data from '../../../data/npm-packages.json'

const props = withDefaults(
  defineProps<{
    highlight?: string
    limit?: number
    showTotals?: boolean
  }>(),
  {
    highlight: 'tanstack-fetch',
    limit: 0,
    showTotals: true,
  },
)

const format = (n: number) => n.toLocaleString('en-US')

const updatedLabel = computed(() => {
  try {
    return new Date(data.updatedAt).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return data.updatedAt
  }
})

const packages = computed(() => {
  const list = [...data.packages].sort((a, b) => b.monthly - a.monthly)
  return props.limit > 0 ? list.slice(0, props.limit) : list
})

const docsHref = (name: string) => {
  if (name === 'tanstack-fetch') {
    return withBase('/guide/getting-started')
  }
  return `https://www.npmjs.com/package/${name}`
}
</script>

<template>
  <div class="npm-packages">
    <div v-if="showTotals" class="npm-totals">
      <div class="npm-total-card">
        <span class="npm-total-label">Weekly downloads</span>
        <strong class="npm-total-value">{{ format(data.totals.weekly) }}</strong>
      </div>
      <div class="npm-total-card">
        <span class="npm-total-label">Monthly downloads</span>
        <strong class="npm-total-value">{{ format(data.totals.monthly) }}</strong>
      </div>
      <div class="npm-total-card">
        <span class="npm-total-label">Packages</span>
        <strong class="npm-total-value">{{ data.packages.length }}</strong>
      </div>
    </div>

    <p class="npm-author">
      Published as
      <a href="https://www.npmjs.com/~mohammad.garmabi" target="_blank" rel="noopener"
        >mohammad.garmabi</a
      >
      ·
      <a href="https://www.linkedin.com/in/mohammad-garmabi/" target="_blank" rel="noopener"
        >LinkedIn</a
      >
      · updated {{ updatedLabel }}
    </p>

    <div class="npm-grid">
      <article
        v-for="pkg in packages"
        :key="pkg.name"
        class="npm-card"
        :class="{ highlight: pkg.name === highlight }"
      >
        <div class="npm-card-top">
          <h3>
            <a
              :href="`https://www.npmjs.com/package/${pkg.name}`"
              target="_blank"
              rel="noopener"
              >{{ pkg.name }}</a
            >
          </h3>
          <span class="npm-version">v{{ pkg.version }}</span>
        </div>
        <p class="npm-desc">{{ pkg.description }}</p>
        <div class="npm-badges">
          <img
            :src="`https://img.shields.io/npm/dw/${pkg.name}?label=week&color=ff7a18`"
            :alt="`${pkg.name} weekly downloads`"
            loading="lazy"
          />
          <img
            :src="`https://img.shields.io/npm/dm/${pkg.name}?label=month&color=c62818`"
            :alt="`${pkg.name} monthly downloads`"
            loading="lazy"
          />
          <img
            :src="`https://img.shields.io/npm/v/${pkg.name}?color=6b7c3a`"
            :alt="`${pkg.name} version`"
            loading="lazy"
          />
        </div>
        <div class="npm-stats">
          <span>{{ format(pkg.weekly) }} / week</span>
          <span>{{ format(pkg.monthly) }} / month</span>
        </div>
        <div class="npm-card-actions">
          <a
            class="npm-chip"
            :href="`https://www.npmjs.com/package/${pkg.name}`"
            target="_blank"
            rel="noopener"
            >npm</a
          >
          <a
            v-if="pkg.name === highlight"
            class="npm-chip brand"
            :href="docsHref(pkg.name)"
            >Docs</a
          >
          <a
            v-if="pkg.name === highlight"
            class="npm-chip"
            :href="withBase('/examples/playground')"
            >Live demos</a
          >
        </div>
      </article>
    </div>
  </div>
</template>
