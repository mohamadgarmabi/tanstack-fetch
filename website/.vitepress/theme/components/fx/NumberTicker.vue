<script setup lang="ts">
/**
 * Counts up to `value` once it scrolls into view — after Inspira UI's NumberTicker
 * (https://inspira-ui.com/docs/en/components/text-animations/number-ticker).
 * SSR and reduced motion render the final value directly.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    format?: (value: number) => string
  }>(),
  {
    duration: 1600,
    format: (value: number) => Math.round(value).toLocaleString('en-US'),
  },
)

const el = ref<HTMLElement | null>(null)
const current = ref(props.value)
const display = computed(() => props.format(current.value))

let frame: number | undefined
let observer: IntersectionObserver | undefined
let started = false

const run = (from: number) => {
  if (frame) cancelAnimationFrame(frame)
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 4)
    current.value = from + (props.value - from) * eased
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => {
  if (!el.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  current.value = 0
  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting || started) return
    started = true
    observer?.disconnect()
    run(0)
  })
  observer.observe(el.value)
})

// Live npm numbers arrive after mount — glide from what's shown.
watch(
  () => props.value,
  () => {
    if (started) run(current.value)
    // No observer = reduced motion: show the new value as-is. Otherwise the pending run picks it up.
    else if (!observer) current.value = props.value
  },
)

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  observer?.disconnect()
})
</script>

<template>
  <span ref="el" class="number-ticker">{{ display }}</span>
</template>

<style scoped>
.number-ticker {
  font-variant-numeric: tabular-nums;
}
</style>
