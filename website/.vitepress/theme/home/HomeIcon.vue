<script setup lang="ts">
// 16×16 stroke icons for the landing page. Paths are hand-drawn to stay dependency-free.
const ICONS = {
  query: ['M2.5 8h3l1.5-4 2 8 1.5-4h3'],
  error: ['M8 2.5 14 13H2L8 2.5Z', 'M8 6.5v3', 'M8 11.3v.2'],
  shield: [
    'M8 1.8 13 3.6v4c0 3-2.1 5.4-5 6.6-2.9-1.2-5-3.6-5-6.6v-4L8 1.8Z',
    'm5.8 8 1.6 1.6 3-3.2',
  ],
  refresh: ['M13 4.5V2m0 2.5h-2.5M13 4.5A5.5 5.5 0 1 0 13.5 9'],
  devtools: ['M2 3.5h12v9H2z', 'M2 6h12', 'm5 8.5 1.5 1.3L5 11', 'M8 11h3'],
  feather: ['M13 3c-4 0-8 2.5-8 7.5V13', 'M5 10.5h4.5C12 10.5 13 7 13 3', 'M3 13h4'],
  plug: ['M6 2v3m4-3v3', 'M4.5 5h7v2.5a3.5 3.5 0 0 1-7 0V5Z', 'M8 11v3'],
  server: ['M2.5 2.5h11v4.5h-11z', 'M2.5 9h11v4.5h-11z', 'M5 4.8h.1M5 11.3h.1'],
  stream: ['M2 5c2-2 4 2 6 0s4-2 6 0', 'M2 8.5c2-2 4 2 6 0s4-2 6 0', 'M2 12c2-2 4 2 6 0s4-2 6 0'],
  upload: ['M8 10.5V2.5m0 0L5 5.5m3-3 3 3', 'M2.5 10v2.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V10'],
  link: [
    'M6.5 9.5 9.5 6.5',
    'M7 4.5 8.5 3a2.5 2.5 0 0 1 3.5 3.5L10.5 8',
    'M9 11.5 7.5 13A2.5 2.5 0 0 1 4 9.5L5.5 8',
  ],
  code: ['m5.5 4.5-3.5 3.5 3.5 3.5', 'm10.5 4.5 3.5 3.5-3.5 3.5', 'm9 3-2 10'],
  atom: [
    'M8 8h.01',
    'M8 2.5c1.5 0 2.5 2.5 2.5 5.5S9.5 13.5 8 13.5 5.5 11 5.5 8 6.5 2.5 8 2.5Z',
    'M2.8 5.3c.8-1.3 3.4-.9 6 .6s4.2 3.6 3.4 4.8-3.4.9-6-.6S2 6.6 2.8 5.3Z',
  ],
  triangle: ['M8 13.5 1.5 2.5h13L8 13.5Z', 'M8 9 5 3.5h6L8 9Z'],
  layers: ['M8 2 14 5 8 8 2 5 8 2Z', 'm2 8 6 3 6-3', 'm2 11 6 3 6-3'],
  terminal: ['m3 4.5 3 3.5-3 3.5', 'M8 11.5h5'],
  users: [
    'M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    'M1.5 13.5c.5-2.5 2.3-4 4.5-4s4 1.5 4.5 4',
    'M10.5 2.7a2.5 2.5 0 0 1 0 4.6M12.5 9.8c1 .6 1.7 1.9 2 3.7',
  ],
  bolt: ['M9 1.5 3 9h4.5L7 14.5 13 7H8.5L9 1.5Z'],
  check: ['m3.5 8.5 3 3 6-6.5'],
  partial: ['M3.5 8h9'],
  cross: ['m4.5 4.5 7 7m0-7-7 7'],
  arrow: ['M3 8h10M9 4l4 4-4 4'],
  external: [
    'M9.5 2.5h4v4',
    'M13.5 2.5 7.5 8.5',
    'M12 9.5v3.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5H7',
  ],
  download: ['M8 2.5v8m0 0 3-3m-3 3-3-3', 'M2.5 12.5h11'],
  star: ['M8 1.8 9.9 5.7l4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.8Z'],
  book: [
    'M2.5 3h4a2 2 0 0 1 1.5.7A2 2 0 0 1 9.5 3h4v9.5h-4a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0-1.5-1.5h-4V3Z',
    'M8 3.7V14',
  ],
} as const

export type HomeIconName = keyof typeof ICONS

defineProps<{ name: HomeIconName }>()
</script>

<template>
  <svg class="home-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path v-for="d in ICONS[name]" :key="d" :d="d" />
  </svg>
</template>

<style scoped>
.home-icon {
  width: 1em;
  height: 1em;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
