<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    packageName?: string
  }>(),
  { packageName: 'tanstack-fetch' },
)

const badgeNonce = ref('')

onMounted(() => {
  badgeNonce.value = String(Date.now())
})

const href = computed(() => `https://www.npmjs.com/package/${props.packageName}`)

const badge = (path: string, color: string, label: string) => {
  const bust = badgeNonce.value ? `&cacheSeconds=60&t=${badgeNonce.value}` : ''
  return `https://img.shields.io/npm/${path}/${props.packageName}?style=for-the-badge&color=${color}&label=${encodeURIComponent(label)}${bust}`
}
</script>

<template>
  <p class="npm-download-badges">
    <a :href="href" target="_blank" rel="noopener">
      <img :src="badge('v', 'ff7a18', 'npm')" :alt="`${packageName} on npm`" />
    </a>
    <a :href="href" target="_blank" rel="noopener">
      <img
        :src="badge('dw', 'f05a12', 'downloads/week')"
        :alt="`${packageName} weekly downloads`"
      />
    </a>
    <a :href="href" target="_blank" rel="noopener">
      <img
        :src="badge('dm', 'c62818', 'downloads/month')"
        :alt="`${packageName} monthly downloads`"
      />
    </a>
    <a :href="href" target="_blank" rel="noopener">
      <img
        :src="badge('dt', '6b7c3a', 'total downloads')"
        :alt="`${packageName} total downloads`"
      />
    </a>
  </p>
</template>
