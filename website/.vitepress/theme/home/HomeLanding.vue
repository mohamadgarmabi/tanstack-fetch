<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import HomeBand from './HomeBand.vue'
import HomeBeam from './HomeBeam.vue'
import HomeBlitz from './HomeBlitz.vue'
import HomeClose from './HomeClose.vue'
import HomeCompare from './HomeCompare.vue'
import HomeFeatures from './HomeFeatures.vue'
import HomeHero from './HomeHero.vue'
import HomePackages from './HomePackages.vue'
import HomePlay from './HomePlay.vue'
import HomeQuick from './HomeQuick.vue'
import HomeShowcase from './HomeShowcase.vue'
import HomeSocial from './HomeSocial.vue'
import HomeWhy from './HomeWhy.vue'
import './sections.css'

// One delegated listener drives the spotlight glow on every `.fx-spotlight` card
// (after Inspira UI's Card Spotlight).
const root = ref<HTMLElement | null>(null)

const onPointerMove = (event: PointerEvent) => {
  const card = (event.target as Element | null)?.closest<HTMLElement>('.fx-spotlight')
  if (!card) return
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  card.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

onMounted(() => root.value?.addEventListener('pointermove', onPointerMove, { passive: true }))
onBeforeUnmount(() => root.value?.removeEventListener('pointermove', onPointerMove))
</script>

<template>
  <div ref="root" class="home-landing">
    <div class="home-wrap">
      <HomeHero />
      <HomeShowcase />
      <HomeBeam />
      <HomeBand />
      <HomeWhy />
      <HomeQuick />
      <HomeFeatures />
      <HomePackages />
      <HomePlay />
      <HomeBlitz />
      <HomeCompare />
      <HomeSocial />
      <HomeClose />
    </div>
  </div>
</template>
