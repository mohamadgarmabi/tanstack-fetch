<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import BlogPostHeader from './blog/BlogPostHeader.vue'
import BlogRelated from './blog/BlogRelated.vue'
import FrameworkPicker from './components/FrameworkPicker.vue'
import NavLiquidGlass from './components/glass/NavLiquidGlass.vue'
import PatternBackground from './components/backgrounds/PatternBackground.vue'

const { Layout } = DefaultTheme
const { page } = useData()

const isBlogPost = computed(() => /^blog\/(?!index\.md$).+\.md$/.test(page.value.relativePath))
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
    <template #doc-before>
      <BlogPostHeader v-if="isBlogPost" />
    </template>
    <template #doc-after>
      <BlogRelated v-if="isBlogPost" />
    </template>
  </Layout>
</template>
