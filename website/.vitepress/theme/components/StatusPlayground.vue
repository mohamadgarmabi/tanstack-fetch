<script setup lang="ts">
import { computed, ref } from 'vue'
import { createFetch, isFetchError, parseRetryAfter } from 'tanstack-fetch'

type StatusButton = {
  status: number
  label: string
  tone: 'ok' | 'auth' | 'client' | 'rate' | 'server'
}

type LogEntry = {
  id: number
  kind: 'handler' | 'result' | 'error'
  text: string
}

const STATUS_BUTTONS: StatusButton[] = [
  { status: 200, label: '200 OK', tone: 'ok' },
  { status: 400, label: '400', tone: 'client' },
  { status: 401, label: '401', tone: 'auth' },
  { status: 403, label: '403', tone: 'auth' },
  { status: 404, label: '404', tone: 'client' },
  { status: 405, label: '405', tone: 'client' },
  { status: 408, label: '408', tone: 'client' },
  { status: 409, label: '409', tone: 'client' },
  { status: 410, label: '410', tone: 'client' },
  { status: 413, label: '413', tone: 'client' },
  { status: 415, label: '415', tone: 'client' },
  { status: 422, label: '422', tone: 'client' },
  { status: 429, label: '429', tone: 'rate' },
  { status: 451, label: '451', tone: 'client' },
  { status: 418, label: '418 → 4xx', tone: 'client' },
  { status: 503, label: '503', tone: 'server' },
]

const logs = ref<LogEntry[]>([])
const busy = ref(false)
const lastResult = ref('Tap a status — real createFetch + mock fetch')
let logId = 0

const pushLog = (kind: LogEntry['kind'], text: string) => {
  logs.value = [{ id: ++logId, kind, text }, ...logs.value].slice(0, 12)
}

const mockFetch: typeof fetch = async (input) => {
  const url = String(input)
  const match = url.match(/\/status\/(\d+)/)
  const status = match ? Number(match[1]) : 200
  const headers: Record<string, string> = { 'content-type': 'application/json' }

  if (status === 429) {
    headers['retry-after'] = '3'
  }

  if (status >= 200 && status < 300) {
    return new Response(JSON.stringify({ ok: true, path: url }), {
      status,
      headers,
    })
  }

  return new Response(
    JSON.stringify({
      code: `HTTP_${status}`,
      message: `Mock response ${status}`,
    }),
    { status, headers },
  )
}

const api = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  plugins: [],
  maxRetries: 0,
  onBadRequest: ({ status }) => pushLog('handler', `onBadRequest (${status})`),
  onUnauthorized: ({ status }) => pushLog('handler', `onUnauthorized (${status})`),
  onForbidden: ({ status }) => pushLog('handler', `onForbidden (${status})`),
  onNotFound: ({ status }) => pushLog('handler', `onNotFound (${status})`),
  onMethodNotAllowed: ({ status }) => pushLog('handler', `onMethodNotAllowed (${status})`),
  onRequestTimeout: ({ status }) => pushLog('handler', `onRequestTimeout (${status})`),
  onConflict: ({ status }) => pushLog('handler', `onConflict (${status})`),
  onGone: ({ status }) => pushLog('handler', `onGone (${status})`),
  onPayloadTooLarge: ({ status }) => pushLog('handler', `onPayloadTooLarge (${status})`),
  onUnsupportedMediaType: ({ status }) => pushLog('handler', `onUnsupportedMediaType (${status})`),
  onUnprocessableEntity: ({ status }) => pushLog('handler', `onUnprocessableEntity (${status})`),
  onTooManyRequests: ({ status, context }) => {
    const waitMs = parseRetryAfter(context.response?.headers, 1000)
    pushLog('handler', `onTooManyRequests (${status}) · retry after ${waitMs}ms`)
  },
  onUnavailableForLegalReasons: ({ status }) =>
    pushLog('handler', `onUnavailableForLegalReasons (${status})`),
  onClientError: ({ status }) => pushLog('handler', `onClientError / 4xx (${status})`),
  onServerError: ({ status }) => pushLog('handler', `onServerError / 5xx (${status})`),
})

const runStatus = async (status: number) => {
  if (busy.value) {
    return
  }
  busy.value = true
  lastResult.value = `Calling GET /status/${status}…`
  try {
    const data = await api.get<{ ok: boolean }>(`/status/${status}`)
    lastResult.value = `Success · ${JSON.stringify(data)}`
    pushLog('result', `get(/status/${status}) → data`)
  } catch (error) {
    if (isFetchError(error)) {
      lastResult.value = `FetchError · ${error.status} · ${error.code} · ${error.message}`
      pushLog('error', `threw FetchError ${error.status} (${error.code})`)
    } else {
      lastResult.value = 'Unexpected error'
      pushLog('error', 'threw unexpected error')
    }
  } finally {
    busy.value = false
  }
}

const clearLogs = () => {
  logs.value = []
  lastResult.value = 'Tap a status — real createFetch + mock fetch'
}

const codeSnippet = computed(
  () => `const api = createFetch({
  onTooManyRequests: ({ context }) => {
    const waitMs = parseRetryAfter(context.response?.headers)
    // show toast / backoff…
  },
  onClientError: ({ status }) => console.warn('4xx', status),
  onUnauthorized: () => logout(),
})`,
)
</script>

<template>
  <section class="status-playground" aria-label="Live status handler playground">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">Live demo · real createFetch</p>
        <h2>Trigger HTTP statuses</h2>
        <p class="status-playground-lead">
          Mock <code>fetch</code> returns the code you click. Handlers fire before
          <code>FetchError</code> is thrown — including <strong>429</strong> with
          <code>Retry-After</code>.
        </p>
      </div>
      <button type="button" class="status-clear" :disabled="busy" @click="clearLogs">
        Clear log
      </button>
    </header>

    <div class="status-grid">
      <button
        v-for="item in STATUS_BUTTONS"
        :key="item.status"
        type="button"
        class="status-chip"
        :class="[`tone-${item.tone}`, { busy }]"
        :disabled="busy"
        @click="runStatus(item.status)"
      >
        {{ item.label }}
      </button>
    </div>

    <p class="status-result" :data-busy="busy ? '1' : '0'">{{ lastResult }}</p>

    <div class="status-panels">
      <div class="status-log" aria-live="polite">
        <h3>Event log</h3>
        <ul v-if="logs.length">
          <li v-for="entry in logs" :key="entry.id" :class="`kind-${entry.kind}`">
            {{ entry.text }}
          </li>
        </ul>
        <p v-else class="status-empty">Handlers and throws show up here.</p>
      </div>
      <pre class="status-code"><code>{{ codeSnippet }}</code></pre>
    </div>
  </section>
</template>
