<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import {
  GITHUB_URL,
  INSTALL_COMMANDS,
  NPM_URL,
  PACKAGE_VERSION,
  RELEASE_POST_URL,
} from './home.content'
import LiquidGlass from '../components/glass/LiquidGlass.vue'
import FlickeringGrid from '../components/backgrounds/FlickeringGrid.vue'
import HomeHeroConsole from './HomeHeroConsole.vue'
import HomeIcon from './HomeIcon.vue'
import NumberTicker from '../components/fx/NumberTicker.vue'
import { formatCount, useNpmPackageStats } from '../composables/use-npm-stats'
import { useGithubStars } from '../composables/use-github-stars'
import './hero.css'

const releaseVersion = `v${PACKAGE_VERSION}`

const { pkg, live: downloadsLive } = useNpmPackageStats('tanstack-fetch')
const { stars } = useGithubStars()

const activeId = ref<(typeof INSTALL_COMMANDS)[number]['id']>('npm')
const copied = ref(false)

const active = computed(
  () => INSTALL_COMMANDS.find((item) => item.id === activeId.value) ?? INSTALL_COMMANDS[0],
)

const select = (id: (typeof INSTALL_COMMANDS)[number]['id']) => {
  activeId.value = id
  copied.value = false
}

const copyInstall = async () => {
  await navigator.clipboard.writeText(active.value.command)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <header class="home-hero">
    <div class="hero-bg" aria-hidden="true">
      <FlickeringGrid
        class="hero-bg-flicker"
        color="#ff7a18"
        :square-size="4"
        :grid-gap="6"
        :flicker-chance="0.22"
        :max-opacity="0.32"
      />
      <div class="hero-bg-glow" />
    </div>

    <div class="hero-grid">
      <div class="hero-copy">
        <LiquidGlass
          as="a"
          class="home-badge"
          :href="withBase(RELEASE_POST_URL)"
          :radius="999"
          :scale="-90"
        >
          <span>{{ releaseVersion }}</span>
          doctor · Solid · Angular · Svelte
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </LiquidGlass>

        <p class="home-hero-brand">tanstack-fetch</p>
        <h1>Typed fetch,<br /><em>made simple.</em></h1>

        <p class="home-hero-lead">
          One request. Data back on success, typed <code>FetchError</code> on failure, AbortSignal
          honored — shaped for TanStack Query. SSR, SSE, upload, refresh-token, and tRPC stay
          optional.
        </p>

        <div class="home-actions">
          <a class="home-btn home-btn-primary" :href="withBase('/docs')">
            <span class="home-btn-shine" aria-hidden="true" />
            Documentation
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </a>
          <LiquidGlass
            as="a"
            class="home-btn"
            :href="withBase('/examples/playground')"
            :radius="999"
            :scale="-110"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4.5v7l6-3.5-6-3.5z" /></svg>
            Playground
          </LiquidGlass>
          <LiquidGlass
            as="a"
            class="home-btn"
            :href="GITHUB_URL"
            target="_blank"
            rel="noopener"
            :radius="999"
            :scale="-110"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M8 1.5a6.5 6.5 0 0 0-2.05 12.66c.32.06.44-.14.44-.31v-1.08c-1.78.39-2.16-.86-2.16-.86-.29-.73-.7-.93-.7-.93-.57-.39.05-.38.05-.38.63.04.96.65.96.65.56.96 1.47.68 1.83.52.06-.41.22-.68.4-.84-1.42-.16-2.91-.71-2.91-3.16 0-.7.25-1.27.66-1.72-.07-.16-.29-.81.06-1.69 0 0 .54-.17 1.77.66a6.1 6.1 0 0 1 3.22 0c1.23-.83 1.77-.66 1.77-.66.35.88.13 1.53.06 1.69.41.45.66 1.02.66 1.72 0 2.46-1.5 3-2.93 3.15.23.2.44.59.44 1.19v1.77c0 .17.12.37.44.31A6.5 6.5 0 0 0 8 1.5z"
              />
            </svg>
            GitHub
          </LiquidGlass>
        </div>

        <LiquidGlass class="home-install-wrap" :radius="18" :scale="-110">
          <div class="home-install-head">
            <span class="home-install-dots" aria-hidden="true"><i /><i /><i /></span>
            <div class="home-install-managers" role="tablist" aria-label="Package manager">
              <button
                v-for="item in INSTALL_COMMANDS"
                :key="item.id"
                type="button"
                role="tab"
                class="home-install-manager"
                :class="{ 'is-active': item.id === active.id }"
                :aria-selected="item.id === active.id"
                @click="select(item.id)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <button class="home-install" type="button" @click="copyInstall">
            <span class="home-install-prompt">$</span>
            <code>{{ active.command }}</code>
            <span class="home-install-copy" :class="{ 'is-copied': copied }">
              <svg v-if="copied" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5 6.5 11.5 12.5 5" />
              </svg>
              <svg v-else viewBox="0 0 16 16" aria-hidden="true">
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
                <path
                  d="M10.5 3.5v-.2A1.3 1.3 0 0 0 9.2 2H3.8A1.3 1.3 0 0 0 2.5 3.3v5.4A1.3 1.3 0 0 0 3.8 10h.2"
                />
              </svg>
              {{ copied ? 'Copied' : 'Copy' }}
            </span>
          </button>
        </LiquidGlass>

        <div class="hero-proof">
          <a
            class="hero-downloads"
            :href="NPM_URL"
            target="_blank"
            rel="noopener"
            :title="downloadsLive ? 'Live from npm' : 'Last build snapshot'"
          >
            <span class="hero-downloads-icon"><HomeIcon name="download" /></span>
            <span class="hero-downloads-main">
              <strong><NumberTicker :value="pkg?.monthly ?? 0" :format="formatCount" /></strong>
              downloads / month
            </span>
            <span class="hero-downloads-week">
              <NumberTicker :value="pkg?.weekly ?? 0" :format="formatCount" /> this week
            </span>
            <span v-if="downloadsLive" class="hero-live-dot" aria-label="live" />
          </a>

          <a
            v-if="stars !== null"
            class="hero-downloads hero-stars"
            :href="GITHUB_URL"
            title="Star tanstack-fetch on GitHub"
            target="_blank"
            rel="noopener"
          >
            <span class="hero-downloads-icon"><HomeIcon name="star" /></span>
            <span class="hero-downloads-main">
              <strong><NumberTicker :value="stars" :format="formatCount" /></strong>
              {{ stars === 1 ? 'star' : 'stars' }}
            </span>
          </a>
        </div>
      </div>

      <div class="hero-visual">
        <HomeHeroConsole />
      </div>
    </div>
  </header>
</template>
