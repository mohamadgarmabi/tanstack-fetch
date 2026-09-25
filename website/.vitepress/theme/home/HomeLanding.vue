<script setup lang="ts">
import HomeBand from './HomeBand.vue'
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
</script>

<template>
  <div class="home-landing">
    <div class="home-wrap">
      <HomeHero />
      <HomeShowcase />
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
