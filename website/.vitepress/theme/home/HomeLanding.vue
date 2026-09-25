<script setup lang="ts">
import HomeBand from './HomeBand.vue'
import HomeClose from './HomeClose.vue'
import HomeCompare from './HomeCompare.vue'
import HomeFeatures from './HomeFeatures.vue'
import HomeHero from './HomeHero.vue'
import HomePackages from './HomePackages.vue'
import HomePlay from './HomePlay.vue'
import HomeShowcase from './HomeShowcase.vue'
</script>

<template>
  <div class="home-landing">
    <div class="home-wrap">
      <HomeHero />
      <HomeShowcase />
      <HomeBand />
      <HomeFeatures />
      <HomePackages />
      <HomePlay />
      <HomeCompare />
      <HomeClose />
    </div>
  </div>
</template>
