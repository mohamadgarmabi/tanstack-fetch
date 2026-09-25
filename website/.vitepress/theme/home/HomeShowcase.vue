<script setup lang="ts">
import { computed, ref } from 'vue'
import { highlightTypeScript } from './home-highlight'
import { showcase } from './home.content'

const activeId = ref(showcase[0]?.id ?? 'query')
const fileIndex = ref(0)

const active = computed(
  () => showcase.find((item) => item.id === activeId.value) ?? showcase[0],
)

const activeFile = computed(() => active.value?.files[fileIndex.value] ?? active.value?.files[0])

const highlighted = computed(() =>
  activeFile.value ? highlightTypeScript(activeFile.value.code) : '',
)

const highlightedOutput = computed(() =>
  active.value ? highlightTypeScript(active.value.output.code) : '',
)

const selectTab = (id: string) => {
  activeId.value = id
  fileIndex.value = 0
}
</script>

<template>
  <section class="home-showcase" aria-label="What tanstack-fetch gives you">
    <div class="home-section-head">
      <p class="home-eyebrow">What you get</p>
      <h2>One client, every call site.</h2>
    </div>

    <div class="home-panel">
      <div class="home-tabs" role="tablist">
        <button
          v-for="item in showcase"
          :id="`tab-${item.id}`"
          :key="item.id"
          type="button"
          role="tab"
          class="home-tab"
          :class="{ 'is-active': item.id === activeId }"
          :aria-selected="item.id === activeId"
          @click="selectTab(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <p v-if="active" class="home-panel-lead">{{ active.lead }}</p>

      <div v-if="active && active.files.length > 1" class="home-files">
        <button
          v-for="(file, index) in active.files"
          :key="file.name"
          type="button"
          class="home-file"
          :class="{ 'is-active': index === fileIndex }"
          @click="fileIndex = index"
        >
          {{ file.name }}
        </button>
      </div>

      <div class="home-split">
        <div class="home-code">
          <div class="home-code-bar">
            <span class="home-code-dots" aria-hidden="true" />
            <span>{{ activeFile?.name }}</span>
          </div>
          <pre><code v-html="highlighted" /></pre>
        </div>

        <div class="home-code home-code-out">
          <div class="home-code-bar">
            <span class="home-code-dots home-code-dots-out" aria-hidden="true" />
            <span>{{ active?.output.name }}</span>
            <em>output</em>
          </div>
          <pre><code v-html="highlightedOutput" /></pre>
        </div>
      </div>
    </div>
  </section>
</template>
