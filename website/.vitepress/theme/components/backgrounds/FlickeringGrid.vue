<script setup lang="ts">
/**
 * Canvas grid of flickering squares, ported from Inspira UI's FlickeringGrid
 * (https://inspira-ui.com/docs/en/components/backgrounds/flickering-grid).
 * Pauses off-screen and renders a single static frame for reduced motion.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    squareSize?: number
    gridGap?: number
    flickerChance?: number
    /** Hex colour, e.g. `#ff7a18`. */
    color?: string
    maxOpacity?: number
  }>(),
  {
    squareSize: 4,
    gridGap: 6,
    flickerChance: 0.3,
    color: '#000000',
    maxOpacity: 0.3,
  },
)

const container = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const toRgbaPrefix = (hex: string) => {
  const value = Number.parseInt(hex.replace(/^#/, ''), 16)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255},`
}

let ctx: CanvasRenderingContext2D | null = null
let grid = { cols: 0, rows: 0, dpr: 1, squares: new Float32Array(0) }
let frame: number | undefined
let lastTime = 0
let inView = false
let reducedMotion = false
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined

const setup = () => {
  if (!canvas.value || !container.value) return
  const { clientWidth: width, clientHeight: height } = container.value
  const dpr = window.devicePixelRatio || 1
  const cell = props.squareSize + props.gridGap
  canvas.value.width = width * dpr
  canvas.value.height = height * dpr
  canvas.value.style.width = `${width}px`
  canvas.value.style.height = `${height}px`

  const cols = Math.ceil(width / cell)
  const rows = Math.ceil(height / cell)
  const squares = new Float32Array(cols * rows)
  for (let i = 0; i < squares.length; i++) squares[i] = Math.random() * props.maxOpacity
  grid = { cols, rows, dpr, squares }
  draw()
}

const draw = () => {
  if (!ctx || !canvas.value) return
  const { cols, rows, dpr, squares } = grid
  const cell = (props.squareSize + props.gridGap) * dpr
  const size = props.squareSize * dpr
  const prefix = toRgbaPrefix(props.color)
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      ctx.fillStyle = `${prefix}${squares[i * rows + j]})`
      ctx.fillRect(i * cell, j * cell, size, size)
    }
  }
}

const tick = (time: number) => {
  if (!inView) return
  const delta = lastTime ? (time - lastTime) / 1000 : 0
  lastTime = time
  const { squares } = grid
  for (let i = 0; i < squares.length; i++) {
    if (Math.random() < props.flickerChance * delta) squares[i] = Math.random() * props.maxOpacity
  }
  draw()
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  if (!canvas.value || !container.value) return
  ctx = canvas.value.getContext('2d')
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  setup()

  resizeObserver = new ResizeObserver(setup)
  resizeObserver.observe(container.value)

  if (reducedMotion) return
  intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = entry?.isIntersecting ?? false
    if (frame) cancelAnimationFrame(frame)
    lastTime = 0
    if (inView) frame = requestAnimationFrame(tick)
  })
  intersectionObserver.observe(canvas.value)
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
})
</script>

<template>
  <div ref="container" class="flickering-grid" aria-hidden="true">
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.flickering-grid {
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.flickering-grid canvas {
  display: block;
}
</style>
