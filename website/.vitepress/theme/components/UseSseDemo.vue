<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { createFetch } from 'tanstack-fetch/sse'
import { isFetchError } from 'tanstack-fetch'

type Tick = { n: number; at: string }
type SseStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

const messages = ref<Tick[]>([])
const status = ref<SseStatus>('disconnected')
const errorText = ref('')
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
        if (n >= 6) {
          if (timer) {
            clearInterval(timer)
            timer = null
          }
          controller.close()
        }
      }, 400)
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

const statusLabel = computed(() => {
  if (status.value === 'connecting') return 'connecting'
  if (status.value === 'connected') return 'connected'
  if (status.value === 'error') return 'error'
  return 'disconnected'
})

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const stop = () => {
  subscription?.close()
  subscription = null
  clearTimer()
  if (status.value !== 'error') {
    status.value = 'disconnected'
  }
}

const start = () => {
  stop()
  messages.value = []
  errorText.value = ''
  status.value = 'connecting'
  subscription = api.sse<Tick>('/orders/stream', {
    onOpen: () => {
      status.value = 'connected'
    },
    onMessage: (data) => {
      messages.value = [data, ...messages.value].slice(0, 8)
    },
    onError: (error) => {
      status.value = 'error'
      errorText.value = isFetchError(error)
        ? `FetchError ${error.status}`
        : error instanceof Error
          ? error.message
          : 'unknown'
    },
    onClose: () => {
      if (status.value !== 'error') {
        status.value = 'disconnected'
      }
      subscription = null
    },
  })
}

onBeforeUnmount(() => {
  stop()
})

const snippet = `import { createFetch } from 'tanstack-fetch/sse'
import { useSse } from 'tanstack-fetch/react'

const api = createFetch({
  baseUrl: import.meta.env.VITE_API_URL,
  plugins: ['sse-resume'],
  getToken: () => localStorage.getItem('access_token'),
})

const OrdersLive = () => {
  // Pass client — FetchProvider is optional
  const { data, status, error, close } = useSse<Tick>('/orders/stream', {
    client: api,
  })

  if (status === 'error') return <p>{error?.message}</p>

  return (
    <div>
      <p>{status}</p>
      <p>{data ? \`#\${data.n}\` : '—'}</p>
      <button type="button" onClick={close}>Disconnect</button>
    </div>
  )
}`
</script>

<template>
  <section class="status-playground" aria-label="useSse demo">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">Live demo · useSse</p>
        <h2>React <code>useSse</code> + status</h2>
        <p class="status-playground-lead">
          Pass <code>{'{ client: api }'}</code> — no <code>FetchProvider</code> required. Status:
          <code>connecting</code> → <code>connected</code> → <code>disconnected</code> /
          <code>error</code>.
        </p>
      </div>
    </header>

    <div class="live-query-actions">
      <button
        type="button"
        class="status-chip tone-ok"
        :disabled="status === 'connecting' || status === 'connected'"
        @click="start"
      >
        Connect
      </button>
      <button
        type="button"
        class="status-chip tone-rate"
        :disabled="status === 'disconnected'"
        @click="stop"
      >
        close()
      </button>
    </div>

    <p class="status-playground-result">
      status: <strong>{{ statusLabel }}</strong>
      <span v-if="errorText"> · {{ errorText }}</span>
    </p>

    <ul v-if="messages.length" class="live-query-users sse-ticks">
      <li v-for="item in messages" :key="item.n">#{{ item.n }} · {{ item.at }}</li>
    </ul>

    <pre class="status-code"><code>{{ snippet }}</code></pre>
  </section>
</template>
