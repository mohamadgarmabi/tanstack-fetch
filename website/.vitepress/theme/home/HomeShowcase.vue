<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { highlightTypeScript } from './home-highlight'
import { showcase } from './home.content'
import HomeIcon, { type HomeIconName } from './HomeIcon.vue'
import LiquidGlass from '../components/glass/LiquidGlass.vue'

const ICON_BY_TAB: Record<string, HomeIconName> = {
  query: 'query',
  migrate: 'arrow',
  errors: 'error',
  status: 'shield',
  refresh: 'refresh',
  devtools: 'devtools',
  ssr: 'server',
  sse: 'stream',
  upload: 'upload',
  trpc: 'link',
  openapi: 'code',
}

const activeId = ref(showcase[0]?.id ?? 'query')
const fileIndex = ref(0)
const panelKey = ref(0)

const active = computed(() => showcase.find((item) => item.id === activeId.value) ?? showcase[0])

const activeFile = computed(() => active.value?.files[fileIndex.value] ?? active.value?.files[0])

const highlighted = computed(() =>
  activeFile.value ? highlightTypeScript(activeFile.value.code) : '',
)

const highlightedOutput = computed(() =>
  active.value ? highlightTypeScript(active.value.output.code) : '',
)

const migrateHref = withBase('/guide/migrate')

const layout = ref<HTMLElement | null>(null)

// Picking a tab after scrolling into a long snippet brings the new one in from its first line.
const scrollToPanelStart = () => {
  if (!layout.value) return
  const navHeight =
    Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height'),
    ) || 64
  const top = layout.value.getBoundingClientRect().top + window.scrollY - navHeight - 16
  if (window.scrollY <= top + 1) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' })
}

const selectTab = (id: string) => {
  if (id === activeId.value) return
  activeId.value = id
  fileIndex.value = 0
  panelKey.value += 1
  scrollToPanelStart()
}

const selectFile = (index: number) => {
  fileIndex.value = index
  panelKey.value += 1
  scrollToPanelStart()
}
</script>

<template>
  <section class="home-showcase" aria-label="What tanstack-fetch gives you">
    <div class="home-section-head">
      <p class="home-eyebrow">What you get</p>
      <h2>One client, every call site.</h2>
      <p class="home-lead">
        Replace axios, ky, ofetch, or raw fetch with one
        <code>createFetch</code>
        client — same
        <code>queryFn</code>
        shape on React, Vue, Nuxt, Next.js, Solid, Angular, Svelte, and SvelteKit.
        <a :href="migrateHref">Migrate guide + CLI</a>
      </p>
    </div>

    <div ref="layout" class="sc-layout">
      <div class="sc-nav" role="tablist" aria-orientation="vertical" aria-label="Capabilities">
        <button
          v-for="item in showcase"
          :id="`tab-${item.id}`"
          :key="item.id"
          type="button"
          role="tab"
          class="sc-nav-item"
          :class="{ 'is-active': item.id === activeId }"
          :aria-selected="item.id === activeId"
          aria-controls="sc-panel"
          @click="selectTab(item.id)"
        >
          <span class="sc-nav-icon"><HomeIcon :name="ICON_BY_TAB[item.id] ?? 'code'" /></span>
          <span class="sc-nav-text">{{ item.label }}</span>
        </button>
      </div>

      <LiquidGlass
        id="sc-panel"
        class="sc-window"
        role="tabpanel"
        :aria-labelledby="`tab-${activeId}`"
        :radius="22"
        :scale="-70"
      >
        <div class="sc-window-bar">
          <span class="sc-dots" aria-hidden="true"><i /><i /><i /></span>
          <div class="sc-files">
            <button
              v-for="(file, index) in active?.files ?? []"
              :key="file.name"
              type="button"
              class="sc-file"
              :class="{ 'is-active': index === fileIndex }"
              @click="selectFile(index)"
            >
              <HomeIcon name="code" />
              {{ file.name }}
            </button>
          </div>
          <span class="sc-lang">TS</span>
        </div>

        <p v-if="active" class="sc-lead">{{ active.lead }}</p>

        <div :key="panelKey" class="sc-body home-split-anim">
          <pre class="sc-code"><code v-html="highlighted" /></pre>
          <div class="sc-output">
            <div class="sc-output-bar">
              <span class="sc-output-dot" aria-hidden="true" />
              {{ active?.output.name }}
              <em>output</em>
            </div>
            <pre><code v-html="highlightedOutput" /></pre>
          </div>
        </div>
      </LiquidGlass>
    </div>
  </section>
</template>
