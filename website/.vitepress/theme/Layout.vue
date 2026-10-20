<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import FrameworkPicker from './components/FrameworkPicker.vue'
import NavLiquidGlass from './components/glass/NavLiquidGlass.vue'
import PatternBackground from './components/backgrounds/PatternBackground.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <PatternBackground
        class="site-pattern"
        variant="grid"
        :size="48"
        color="rgba(255, 255, 255, 0.06)"
        animate
        direction="top"
        :speed="30000"
        mask="ellipse"
      />
    </template>
    <template #nav-bar-content-before>
      <NavLiquidGlass />
    </template>
    <template #nav-bar-content-after>
      <FrameworkPicker />
    </template>
  </Layout>
</template>
