<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { releases } from './home.content'

const track = ref<HTMLElement | null>(null)
const atStart = ref(true)
const atEnd = ref(false)

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const sync = () => {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 2
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
}

const step = (direction: 1 | -1) => {
  const el = track.value
  const card = el?.querySelector<HTMLElement>('.hero-release')
  if (!el || !card) return
  el.scrollBy({ left: direction * (card.offsetWidth + 12), behavior: 'smooth' })
}

onMounted(() => {
  sync()
  window.addEventListener('resize', sync)
})
onBeforeUnmount(() => window.removeEventListener('resize', sync))
</script>

<template>
  <section class="hero-releases" aria-label="Release history">
    <div class="hero-releases-head">
      <p class="hero-releases-title">What's new</p>
      <div class="hero-releases-nav">
        <button type="button" aria-label="Previous releases" :disabled="atStart" @click="step(-1)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3M7 4 3 8l4 4" /></svg>
        </button>
        <button type="button" aria-label="Next releases" :disabled="atEnd" @click="step(1)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
        </button>
      </div>
    </div>

    <ol ref="track" class="hero-releases-track" @scroll.passive="sync">
      <li v-for="(item, index) in releases" :key="item.version">
        <a class="hero-release" :class="{ 'is-latest': index === 0 }" :href="withBase(item.href)">
          <span class="hero-release-top">
            <span class="hero-release-version">v{{ item.version }}</span>
            <span v-if="index === 0" class="hero-release-new">Latest</span>
            <time :datetime="item.date">{{ formatDate(item.date) }}</time>
          </span>
          <strong>{{ item.title }}</strong>
          <span class="hero-release-text">{{ item.text }}</span>
          <span class="hero-release-more">
            Read the post
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </span>
        </a>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.hero-releases {
  position: relative;
  margin-top: clamp(2.5rem, 6vw, 4rem);
}

.hero-releases-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.hero-releases-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 176, 106, 0.85);
}

.hero-releases-nav {
  display: flex;
  gap: 0.4rem;
}

.hero-releases-nav button {
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  cursor: pointer;
  transition:
    border-color 0.3s var(--fx-ease),
    opacity 0.3s var(--fx-ease);
}

.hero-releases-nav button:hover:not(:disabled) {
  border-color: rgba(255, 176, 106, 0.45);
}

.hero-releases-nav button:disabled {
  opacity: 0.35;
  cursor: default;
}

.hero-releases-nav svg,
.hero-release-more svg {
  width: 0.9rem;
  height: 0.9rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hero-releases-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(15.5rem, calc((100% - 3 * 0.75rem) / 4));
  gap: 0.75rem;
  margin: 0;
  padding: 0.25rem 0.1rem 0.6rem;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  mask-image: linear-gradient(90deg, #000 92%, transparent);
}

.hero-releases-track::-webkit-scrollbar {
  display: none;
}

.hero-releases-track li {
  scroll-snap-align: start;
}

.hero-release {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  height: 100%;
  padding: 1rem 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.3s var(--fx-ease),
    transform 0.3s var(--fx-ease),
    background 0.3s var(--fx-ease);
}

.hero-release:hover {
  border-color: rgba(255, 176, 106, 0.4);
  background: rgba(255, 122, 24, 0.06);
  transform: translateY(-2px);
}

.hero-release:focus-visible {
  outline: 2px solid rgba(255, 122, 24, 0.65);
  outline-offset: 3px;
}

.hero-release.is-latest {
  border-color: rgba(255, 176, 106, 0.3);
  background: linear-gradient(160deg, rgba(255, 122, 24, 0.12), rgba(255, 255, 255, 0.02));
}

.hero-release-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.hero-release-version {
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 122, 24, 0.16);
  color: #ffb06a;
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
}

.hero-release-new {
  color: #ffb06a;
  font-weight: 600;
}

.hero-release-top time {
  margin-left: auto;
  opacity: 0.55;
}

.hero-release strong {
  font-size: 0.98rem;
  line-height: 1.3;
}

.hero-release-text {
  flex: 1;
  font-size: 0.83rem;
  line-height: 1.5;
  opacity: 0.68;
}

.hero-release-more {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #ffb06a;
}

.hero-release:hover .hero-release-more svg {
  transform: translateX(2px);
}

.hero-release-more svg {
  transition: transform 0.3s var(--fx-ease);
}

@media (max-width: 640px) {
  .hero-releases-track {
    grid-auto-columns: 82%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-release,
  .hero-release-more svg {
    transition: none;
  }

  .hero-release:hover {
    transform: none;
  }
}
</style>
