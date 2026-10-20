<script setup lang="ts">
import { computed, ref } from 'vue'
import LiquidGlassFilter, { type LiquidGlassOptions } from './LiquidGlassFilter.vue'

const props = withDefaults(defineProps<LiquidGlassOptions & { as?: string; frost?: number }>(), {
  as: 'div',
  radius: 16,
  frost: 0.05,
})

const root = ref<HTMLElement | null>(null)

const filterOptions = computed(() => {
  const { as: _as, frost: _frost, ...options } = props
  return options
})
</script>

<template>
  <component
    :is="as"
    ref="root"
    class="liquid-glass"
    :style="{ '--lg-frost': frost, '--lg-radius': `${radius}px` }"
  >
    <slot />
    <LiquidGlassFilter v-bind="filterOptions" :target="root" />
  </component>
</template>
