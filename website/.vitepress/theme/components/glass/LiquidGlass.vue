<script setup lang="ts">
import { computed, ref } from 'vue'
import LiquidGlassFilter from './LiquidGlassFilter.vue'

// Mirrors LiquidGlassOptions in LiquidGlassFilter.vue. Kept inline on purpose: defineProps
// can only resolve *imported* types when TypeScript is installed, and the docs build
// (website/, deployed by .github/workflows/docs.yml) doesn't depend on it.
interface Props {
  as?: string
  frost?: number
  radius?: number
  border?: number
  lightness?: number
  displace?: number
  blend?: string
  xChannel?: 'R' | 'G' | 'B'
  yChannel?: 'R' | 'G' | 'B'
  alpha?: number
  blur?: number
  rOffset?: number
  gOffset?: number
  bOffset?: number
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
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
