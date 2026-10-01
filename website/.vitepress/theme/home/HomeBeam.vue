<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type BeamNode = {
  id: string
  label: string
  href: string
  side: 'left' | 'right'
}

const nodes: BeamNode[] = [
  { id: 'query', label: 'Query', href: '/guide/tanstack-query', side: 'left' },
  { id: 'ssr', label: 'SSR', href: '/guide/ssr', side: 'left' },
  { id: 'sse', label: 'SSE', href: '/guide/sse', side: 'left' },
  { id: 'react', label: 'React', href: '/guide/react', side: 'right' },
  { id: 'vue', label: 'Vue / Nuxt', href: '/guide/vue', side: 'right' },
  { id: 'trpc', label: 'tRPC', href: '/guide/trpc', side: 'right' },
]

const containerRef = ref<HTMLElement | null>(null)
const centerRef = ref<HTMLElement | null>(null)
const nodeRefs = ref<Record<string, HTMLElement | null>>({})

const setNodeRef = (id: string, el: Element | null) => {
  nodeRefs.value[id] = el instanceof HTMLElement ? el : null
}

type BeamPath = {
  id: string
  d: string
  reverse: boolean
  duration: number
  delay: number
}

const svgSize = ref({ width: 0, height: 0 })
const paths = ref<BeamPath[]>([])

const updatePaths = () => {
  const container = containerRef.value
  const center = centerRef.value
  if (!container || !center) return

  const containerRect = container.getBoundingClientRect()
  svgSize.value = { width: containerRect.width, height: containerRect.height }

  const centerRect = center.getBoundingClientRect()
  const startX = centerRect.left - containerRect.left + centerRect.width / 2
  const startY = centerRect.top - containerRect.top + centerRect.height / 2

  paths.value = nodes.flatMap((node, index) => {
    const el = nodeRefs.value[node.id]
    if (!el) return []

    const rect = el.getBoundingClientRect()
    const endX = rect.left - containerRect.left + rect.width / 2
    const endY = rect.top - containerRect.top + rect.height / 2
    const curvature = node.side === 'left' ? 56 : -56
    const controlX = (startX + endX) / 2
    const controlY = (startY + endY) / 2 - curvature
    const d = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`

    return [
      {
        id: node.id,
        d,
        reverse: node.side === 'left',
        duration: 3.4 + (index % 3) * 0.45,
        delay: index * 0.22,
      },
    ]
  })
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(updatePaths))
  schedule()
  if (!containerRef.value) return
  resizeObserver = new ResizeObserver(() => updatePaths())
  resizeObserver.observe(containerRef.value)
  window.addEventListener('resize', updatePaths)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updatePaths)
})

const gradientIdFor = (id: string) => `home-beam-grad-${id}`
</script>

<template>
  <section class="home-beam" aria-label="One client connected to every call site">
    <div class="home-section-head">
      <p class="home-eyebrow">Call graph</p>
      <h2>One client. Beams to every surface.</h2>
      <p class="home-lead">
        Auth, plugins, and typed errors stay on <code>createFetch</code>. Query, SSR, SSE, React,
        Vue, and tRPC only plug in.
      </p>
    </div>

    <div ref="containerRef" class="home-beam-stage">
      <svg
        class="home-beam-svg"
        :width="svgSize.width"
        :height="svgSize.height"
        :viewBox="`0 0 ${svgSize.width} ${svgSize.height}`"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            v-for="path in paths"
            :id="gradientIdFor(path.id)"
            :key="`grad-${path.id}`"
            gradientUnits="userSpaceOnUse"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="0%"
          >
            <stop offset="0%" stop-color="#ff7a18" stop-opacity="0" />
            <stop offset="32%" stop-color="#ff7a18" stop-opacity="1" />
            <stop offset="68%" stop-color="#ffb347" stop-opacity="1" />
            <stop offset="100%" stop-color="#ffb347" stop-opacity="0" />
            <animate
              attributeName="x1"
              :values="path.reverse ? '90%; -10%' : '10%; 110%'"
              :dur="`${path.duration}s`"
              :begin="`${path.delay}s`"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              :values="path.reverse ? '100%; 0%' : '0%; 100%'"
              :dur="`${path.duration}s`"
              :begin="`${path.delay}s`"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>

        <path
          v-for="path in paths"
          :key="`base-${path.id}`"
          :d="path.d"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          stroke-width="1.5"
        />
        <path
          v-for="path in paths"
          :key="`glow-${path.id}`"
          :d="path.d"
          fill="none"
          :stroke="`url(#${gradientIdFor(path.id)})`"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>

      <div class="home-beam-layout">
        <div class="home-beam-col">
          <a
            v-for="node in nodes.filter((item) => item.side === 'left')"
            :key="node.id"
            :ref="(el) => setNodeRef(node.id, el as Element | null)"
            class="home-beam-node"
            :href="withBase(node.href)"
          >
            {{ node.label }}
          </a>
        </div>

        <div ref="centerRef" class="home-beam-center">
          <span>createFetch</span>
          <em>one client</em>
        </div>

        <div class="home-beam-col">
          <a
            v-for="node in nodes.filter((item) => item.side === 'right')"
            :key="node.id"
            :ref="(el) => setNodeRef(node.id, el as Element | null)"
            class="home-beam-node"
            :href="withBase(node.href)"
          >
            {{ node.label }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
