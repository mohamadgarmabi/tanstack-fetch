<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import LiquidGlass from '../components/glass/LiquidGlass.vue'

interface ConsoleStep {
  call: string
  method: 'GET' | 'POST'
  status: string
  tone: 'ok' | 'error' | 'refresh'
  time: string
  result: string
  type: string
  /** Shown while the row is in flight (e.g. the 401 before a refresh). */
  pendingStatus?: string
  pendingText?: string
}

const steps: ConsoleStep[] = [
  {
    method: 'GET',
    call: "api.get<User[]>('/users', { signal })",
    status: '200',
    tone: 'ok',
    time: '42ms',
    result: "[{ id: '1', name: 'Ada' }, …]",
    type: 'User[]',
  },
  {
    method: 'GET',
    call: "api.get<User>('/me')",
    status: '200',
    tone: 'refresh',
    time: '96ms',
    result: "{ id: 'u_1' } · retried once",
    type: 'User',
    pendingStatus: '401',
    pendingText: 'token expired → refreshing…',
  },
  {
    method: 'GET',
    call: "api.get('/admin')",
    status: '403',
    tone: 'error',
    time: '18ms',
    result: "{ status: 403, code: 'HTTP_ERROR', body }",
    type: 'FetchError',
  },
  {
    method: 'POST',
    call: "api.upload('/files', { file, onUploadProgress })",
    status: '201',
    tone: 'ok',
    time: '1.2s',
    result: "{ id: 'f_91', size: '2.4MB' }",
    type: 'Upload',
  },
]

// `shown` = how many rows have resolved; the next one is "pending".
const shown = ref(steps.length)
const pending = ref(false)
let timer: number | undefined

const valueFor = (step: ConsoleStep, index: number) => {
  if (index < shown.value) return step.result
  if (pending.value && index === shown.value && step.pendingText) return step.pendingText
  return '…'
}

const advance = () => {
  if (shown.value >= steps.length) {
    shown.value = 0
    pending.value = false
    timer = window.setTimeout(advance, 600)
    return
  }
  pending.value = true
  const inFlight = steps[shown.value]?.pendingText ? 1800 : 900
  timer = window.setTimeout(() => {
    pending.value = false
    shown.value += 1
    timer = window.setTimeout(advance, shown.value >= steps.length ? 3600 : 1300)
  }, inFlight)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = window.setTimeout(advance, 2400)
})

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <LiquidGlass class="hero-console" :radius="22" :scale="-120" :frost="0.03">
    <div class="hero-console-bar">
      <span class="hero-console-dots" aria-hidden="true"><i /><i /><i /></span>
      <span class="hero-console-title">api.ts</span>
      <span class="hero-console-live"><i aria-hidden="true" />live</span>
    </div>

    <ol class="hero-console-rows" aria-label="Example requests">
      <li
        v-for="(step, index) in steps"
        :key="step.call"
        class="hero-console-row"
        :class="{
          'is-done': index < shown,
          'is-pending': pending && index === shown,
          'is-refreshing': pending && index === shown && !!step.pendingStatus,
        }"
        :data-tone="step.tone"
      >
        <div class="hero-console-req">
          <span class="hero-console-method">{{ step.method }}</span>
          <code>{{ step.call }}</code>
        </div>
        <div class="hero-console-res">
          <span class="hero-console-status">
            <template v-if="index < shown">{{ step.status }}</template>
            <template v-else-if="pending && index === shown && step.pendingStatus">
              {{ step.pendingStatus }}
            </template>
            <span v-else class="hero-console-spinner" aria-hidden="true" />
          </span>
          <code class="hero-console-value">{{ valueFor(step, index) }}</code>
          <span v-if="step.tone === 'refresh' && index < shown" class="hero-console-badge">
            ↻ refreshed
          </span>
          <span class="hero-console-type">{{ step.type }}</span>
          <span class="hero-console-time">{{ index < shown ? step.time : '' }}</span>
        </div>
        <span
          v-if="step.method === 'POST'"
          class="hero-console-progress"
          :class="{ 'is-running': pending && index === shown }"
          aria-hidden="true"
        />
      </li>
    </ol>

    <div class="hero-console-foot">
      <span><b>data</b> on success</span>
      <span><b>FetchError</b> on failure</span>
      <span><b>AbortSignal</b> honored</span>
    </div>
  </LiquidGlass>
</template>
