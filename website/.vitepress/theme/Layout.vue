<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import FrameworkPicker from './components/FrameworkPicker.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <FrameworkPicker />
    </template>
  </Layout>
</template>
