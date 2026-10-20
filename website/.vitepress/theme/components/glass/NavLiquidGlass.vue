<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LiquidGlassFilter from './LiquidGlassFilter.vue'

// Rendered inside the nav bar slot; the glass is applied to the floating pill around it.
const anchor = ref<HTMLElement | null>(null)
const pill = ref<HTMLElement | null>(null)

onMounted(() => {
  pill.value =
    anchor.value?.closest('.VPNavBar')?.querySelector<HTMLElement>(':scope > .wrapper') ?? null
})
</script>

<template>
  <span ref="anchor" class="nav-glass-anchor" aria-hidden="true">
    <LiquidGlassFilter :target="pill" :radius="999" :border="0.1" :blur="9" :scale="-140" />
  </span>
</template>

<style scoped>
.nav-glass-anchor {
  position: absolute;
  width: 0;
  height: 0;
}
</style>
