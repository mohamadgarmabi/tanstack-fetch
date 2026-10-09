<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import {
  applyFrameworkFilter,
  FRAMEWORK_OPTIONS,
  framework,
  useDocsFramework,
} from '../composables/use-docs-framework'

useDocsFramework()

const route = useRoute()
const sectionCount = ref(0)
const visibleCount = ref(0)

const recountSections = () => {
  if (typeof document === 'undefined') return
  const sections = [...document.querySelectorAll<HTMLElement>('.fw-section[data-fw]')]
  sectionCount.value = sections.length
  applyFrameworkFilter(framework.value)
  visibleCount.value = sections.filter((section) => !section.hidden).length
}

const hint = computed(() => {
  if (framework.value === 'all') {
    return 'Show every framework section'
  }
  if (sectionCount.value === 0) {
    return 'Core docs stay visible — framework hubs filter in the sidebar'
  }
  return `Showing core + ${framework.value} (${visibleCount.value} sections)`
})

onMounted(() => {
  recountSections()
})

watch(
  () => route.path,
  () => {
    requestAnimationFrame(() => recountSections())
  },
)

watch(framework, () => {
  requestAnimationFrame(() => recountSections())
})
</script>

<template>
  <label class="fw-picker" :title="hint">
    <span class="fw-picker-label">Framework</span>
    <select v-model="framework" class="fw-picker-select" aria-label="Filter docs by framework">
      <option v-for="item in FRAMEWORK_OPTIONS" :key="item.id" :value="item.id">
        {{ item.label }}
      </option>
    </select>
  </label>
</template>
