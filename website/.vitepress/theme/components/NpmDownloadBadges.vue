<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { countBadgeUrl, useNpmPackageStats } from '../composables/use-npm-stats'

const props = withDefaults(
  defineProps<{
    packageName?: string
  }>(),
  { packageName: 'tanstack-fetch' },
)

const { pkg } = useNpmPackageStats(props.packageName)
const badgeNonce = ref('')

onMounted(() => {
  badgeNonce.value = String(Date.now())
})

const href = computed(() => `https://www.npmjs.com/package/${props.packageName}`)

const versionBadge = computed(() => {
  const bust = badgeNonce.value ? `&cacheSeconds=60&t=${badgeNonce.value}` : ''
  return `https://img.shields.io/npm/v/${props.packageName}?style=for-the-badge&color=ff7a18&label=npm${bust}`
})

// Download badges use counts fetched from the npm API (see use-npm-stats).
const countBadge = (label: string, value: number | undefined, color: string) =>
  countBadgeUrl(label, value ?? 0, color, 'for-the-badge')
</script>

<template>
  <p class="npm-download-badges">
    <a :href="href" target="_blank" rel="noopener">
      <img :src="versionBadge" :alt="`${packageName} on npm`" />
    </a>
    <a :href="href" target="_blank" rel="noopener">
      <img
        :src="countBadge('downloads/week', pkg?.weekly, 'f05a12')"
        :alt="`${packageName} weekly downloads`"
      />
    </a>
    <a :href="href" target="_blank" rel="noopener">
      <img
        :src="countBadge('downloads/month', pkg?.monthly, 'c62818')"
        :alt="`${packageName} monthly downloads`"
      />
    </a>
    <a :href="href" target="_blank" rel="noopener">
      <img
        :src="countBadge('total downloads', pkg?.total, '6b7c3a')"
        :alt="`${packageName} total downloads`"
      />
    </a>
  </p>
</template>
