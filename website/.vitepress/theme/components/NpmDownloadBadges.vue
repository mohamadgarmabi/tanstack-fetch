<script setup lang="ts">
withDefaults(
  defineProps<{
    packageName?: string
  }>(),
  { packageName: 'tanstack-fetch' },
)
</script>

<template>
  <p class="npm-download-badges">
    <a :href="`https://www.npmjs.com/package/${packageName}`" target="_blank" rel="noopener">
      <img
        :src="`https://img.shields.io/npm/v/${packageName}?style=for-the-badge&color=ff7a18&label=npm`"
        :alt="`${packageName} on npm`"
      />
    </a>
    <a :href="`https://www.npmjs.com/package/${packageName}`" target="_blank" rel="noopener">
      <img
        :src="`https://img.shields.io/npm/dw/${packageName}?style=for-the-badge&color=f05a12&label=downloads%2Fweek`"
        :alt="`${packageName} weekly downloads`"
      />
    </a>
    <a :href="`https://www.npmjs.com/package/${packageName}`" target="_blank" rel="noopener">
      <img
        :src="`https://img.shields.io/npm/dm/${packageName}?style=for-the-badge&color=c62818&label=downloads%2Fmonth`"
        :alt="`${packageName} monthly downloads`"
      />
    </a>
    <a :href="`https://www.npmjs.com/package/${packageName}`" target="_blank" rel="noopener">
      <img
        :src="`https://img.shields.io/npm/dt/${packageName}?style=for-the-badge&color=6b7c3a&label=total%20downloads`"
        :alt="`${packageName} total downloads`"
      />
    </a>
  </p>
</template>
