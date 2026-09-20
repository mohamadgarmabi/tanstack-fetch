<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { createFetch } from 'tanstack-fetch/sse'
import { isFetchError } from 'tanstack-fetch'

type Tick = { n: number; at: string }

const messages = ref<Tick[]>([])
const status = ref('Idle — start the stream')
const connected = ref(false)
let subscription: { close: () => void } | null = null
let timer: ReturnType<typeof setInterval> | null = null

const encoder = new TextEncoder()

const buildStream = () => {
  let n = 0
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(encoder.encode(': connected\n\n'))
      timer = setInterval(() => {
        n += 1
        const payload = JSON.stringify({ n, at: new Date().toISOString() })
        controller.enqueue(encoder.encode(`id: ${n}\nevent: tick\ndata: ${payload}\n\n`))
        if (n >= 8) {
          if (timer) {
            clearInterval(timer)
            timer = null
          }
          controller.close()
        }
      }, 450)
    },
    cancel: () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    },
  })
}

const mockFetch: typeof fetch = async () =>
  new Response(buildStream(), {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
    },
  })

const api = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  plugins: ['sse-resume'],
  getToken: () => 'demo-token',
})

const stop = () => {
  subscription?.close()
  subscription = null
  connected.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  status.value = 'Stream closed'
}

const start = () => {
  stop()
  messages.value = []
  connected.value = true
  status.value = 'Connecting…'
  subscription = api.sse<Tick>('/orders/stream', {
    onOpen: () => {
      status.value = 'Live · Authorization Bearer works (fetch SSE, not EventSource)'
    },
    onMessage: (data) => {
      messages.value = [data, ...messages.value].slice(0, 8)
      status.value = `tick #${data.n}`
    },
    onError: (error) => {
      connected.value = false
      status.value = isFetchError(error)
        ? `SSE FetchError ${error.status}`
        : `SSE error: ${error instanceof Error ? error.message : 'unknown'}`
    },
    onClose: () => {
      connected.value = false
      status.value = 'Stream ended'
      subscription = null
    },
  })
}

onBeforeUnmount(() => {
  stop()
})

const snippet = `import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const stream = api.sse<Tick>('/orders/stream', {
  onMessage: (data) => setTicks((t) => [data, ...t]),
})
// stream.close()`
</script>

<template>
  <section class="status-playground" aria-label="Live SSE demo">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">Live demo · SSE</p>
        <h2>api.sse over fetch</h2>
        <p class="status-playground-lead">
          Real <code>tanstack-fetch/sse</code> against a mock event stream — cookies /
          <code>Authorization</code> work (unlike <code>EventSource</code>).
        </p>
      </div>
    </header>

    <div class="live-query-actions">
      <button type="button" class="status-chip tone-ok" :disabled="connected" @click="start">
        Start stream
      </button>
      <button type="button" class="status-chip tone-rate" :disabled="!connected" @click="stop">
        Close
      </button>
    </div>

    <p class="status-result" :data-busy="connected ? '1' : '0'">{{ status }}</p>

    <ul v-if="messages.length" class="live-query-users sse-ticks">
      <li v-for="item in messages" :key="item.n">#{{ item.n }} · {{ item.at }}</li>
    </ul>

    <pre class="status-code"><code>{{ snippet }}</code></pre>
  </section>
</template>
