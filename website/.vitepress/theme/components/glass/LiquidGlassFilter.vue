<script setup lang="ts">
/**
 * SVG displacement filter ported from Inspira UI's LiquidGlass
 * (https://inspira-ui.com/docs/en/components/visualization/liquid-glass).
 *
 * Renders a per-element filter sized to `target`, exposes it through the
 * `--lg-filter` custom property and marks the target with `data-liquid`.
 * Only Chromium supports `backdrop-filter: url()`, so other engines keep the
 * frosted-glass fallback declared in CSS.
 */
import { computed, onMounted, onUnmounted, reactive, ref, useId, watch } from 'vue'

export interface LiquidGlassOptions {
  radius?: number
  border?: number
  lightness?: number
  displace?: number
  blend?: string
  xChannel?: 'R' | 'G' | 'B'
  yChannel?: 'R' | 'G' | 'B'
  alpha?: number
  blur?: number
  rOffset?: number
  gOffset?: number
  bOffset?: number
  scale?: number
}

const props = withDefaults(defineProps<LiquidGlassOptions & { target: HTMLElement | null }>(), {
  radius: 16,
  border: 0.07,
  lightness: 50,
  displace: 0,
  blend: 'difference',
  xChannel: 'R',
  yChannel: 'B',
  alpha: 0.93,
  blur: 11,
  rOffset: 0,
  gOffset: 10,
  bOffset: 20,
  scale: -180,
})

const filterId = `lg-${useId()}`
const supported = ref(false)
const size = reactive({ width: 0, height: 0 })

const mapUri = computed(() => {
  const { width, height } = size
  const inset = Math.min(width, height) * (props.border * 0.5)
  const svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
      <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="black"/>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${props.radius}" fill="url(#r)"/>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${props.radius}" fill="url(#b)" style="mix-blend-mode:${props.blend}"/>
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="${props.radius}" fill="hsl(0 0% ${props.lightness}% / ${props.alpha})" style="filter:blur(${props.blur}px)"/>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
})

const channels = [
  { offset: () => props.rOffset, matrix: '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0' },
  { offset: () => props.gOffset, matrix: '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0' },
  { offset: () => props.bOffset, matrix: '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0' },
]

let observer: ResizeObserver | null = null

const bind = (el: HTMLElement | null, prev?: HTMLElement | null) => {
  observer?.disconnect()
  prev?.style.removeProperty('--lg-filter')
  prev?.removeAttribute('data-liquid')
  if (!el) return
  if (supported.value) {
    el.style.setProperty('--lg-filter', `url(#${filterId})`)
    el.setAttribute('data-liquid', '')
  }
  observer = new ResizeObserver(([entry]) => {
    const box = entry?.borderBoxSize?.[0]
    size.width = box ? box.inlineSize : (entry?.contentRect.width ?? 0)
    size.height = box ? box.blockSize : (entry?.contentRect.height ?? 0)
  })
  observer.observe(el)
}

onMounted(() => {
  // `userAgentData` is Chromium-only — the one engine that renders SVG backdrop filters.
  supported.value = 'userAgentData' in navigator
  bind(props.target)
})

watch(
  () => props.target,
  (el, prev) => bind(el, prev),
)

onUnmounted(() => bind(null, props.target))
</script>

<template>
  <svg v-if="supported" class="lg-filter" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter :id="filterId" color-interpolation-filters="sRGB">
        <feImage x="0" y="0" width="100%" height="100%" :href="mapUri" result="map" />
        <template v-for="(ch, i) in channels" :key="i">
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            :xChannelSelector="xChannel"
            :yChannelSelector="yChannel"
            :scale="scale + ch.offset()"
            :result="`disp${i}`"
          />
          <feColorMatrix :in="`disp${i}`" type="matrix" :values="ch.matrix" :result="`ch${i}`" />
        </template>
        <feBlend in="ch0" in2="ch1" mode="screen" result="rg" />
        <feBlend in="rg" in2="ch2" mode="screen" result="output" />
        <feGaussianBlur :stdDeviation="displace" />
      </filter>
    </defs>
  </svg>
</template>

<style scoped>
.lg-filter {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
