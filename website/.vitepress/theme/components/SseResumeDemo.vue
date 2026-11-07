<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { createFetch } from 'tanstack-fetch/sse'

type Tick = { n: number }
type Attempt = { conn: number; sentId: string | null; firstServed: number; end: string }

const TOTAL = 24
const encoder = new TextEncoder()

const resume = ref(true)
const running = ref(false)
const status = ref('Idle')
const attempts = ref<Attempt[]>([])
// id -> list of connection numbers that delivered it (length > 1 means duplicate)
const received = ref<Record<number, number[]>>({})
const lastId = ref<string | undefined>(undefined)

let conn = 0
let cutCurrent: (() => void) | null = null
let subscription: { close: () => void } | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

// Simulated server: honours Last-Event-ID, streams ids after it, one every 450 ms.
const mockFetch: typeof fetch = async (_url, init) => {
  const sentId = new Headers(init?.headers).get('last-event-id')
  let n = sentId ? Number(sentId) : 0
  conn += 1
  attempts.value = [...attempts.value, { conn, sentId, firstServed: n + 1, end: 'live' }]
  let timer: ReturnType<typeof setInterval> | null = null
  const stopTimer = () => {
    if (timer) clearInterval(timer)
    timer = null
  }
  const body = new ReadableStream<Uint8Array>({
    start: (controller) => {
      const fail = (error: Error) => {
        stopTimer()
        try {
          controller.error(error)
        } catch {
          // already closed
        }
      }
      cutCurrent = () => fail(new TypeError('network connection lost (simulated)'))
      init?.signal?.addEventListener('abort', () =>
        fail(new DOMException('Aborted', 'AbortError')),
      )
      timer = setInterval(() => {
        n += 1
        controller.enqueue(encoder.encode(`id: ${n}\ndata: {"n":${n}}\n\n`))
        if (n >= TOTAL) {
          stopTimer()
          controller.close()
        }
      }, 450)
    },
    cancel: stopTimer,
  })
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
}

const api = createFetch({ baseUrl: 'https://simulated.local', fetch: mockFetch })

const markEnd = (end: string) => {
  const list = attempts.value
  if (list.length) list[list.length - 1] = { ...list[list.length - 1], end }
}

const connect = () => {
  status.value = `Connecting${resume.value && lastId.value ? ` · Last-Event-ID: ${lastId.value}` : ''}…`
  subscription = api.sse<Tick>('/events', {
    lastEventId: resume.value ? lastId.value : undefined,
    onOpen: () => {
      status.value = 'Live'
    },
    onEvent: (event) => {
      if (!event.id) return
      const id = Number(event.id)
      const current = conn
      received.value = { ...received.value, [id]: [...(received.value[id] ?? []), current] }
      lastId.value = event.id
    },
    onError: () => {
      markEnd('dropped')
      subscription = null
      status.value = 'Connection lost · reconnecting in 1s'
      reconnectTimer = setTimeout(connect, 1000)
    },
    onClose: () => {
      markEnd(lastId.value === String(TOTAL) ? 'complete' : 'closed')
      subscription = null
      running.value = false
      status.value = lastId.value === String(TOTAL) ? 'Stream complete' : 'Closed'
    },
  })
}

const start = () => {
  reset()
  running.value = true
  connect()
}

const cut = () => cutCurrent?.()

const reset = () => {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = null
  subscription?.close()
  subscription = null
  running.value = false
  conn = 0
  attempts.value = []
  received.value = {}
  lastId.value = undefined
  status.value = 'Idle'
}

const duplicates = computed(() =>
  Object.values(received.value).reduce((sum, list) => sum + list.length - 1, 0),
)
const uniqueCount = computed(() => Object.keys(received.value).length)
const cells = Array.from({ length: TOTAL }, (_, i) => i + 1)

onBeforeUnmount(reset)

const snippet = `import { createFetch } from 'tanstack-fetch/sse'

const api = createFetch({ baseUrl: '/api' })
let lastEventId: string | undefined

const connect = () =>
  api.sse<Tick>('/events', {
    lastEventId, // sent as the Last-Event-ID header
    onEvent: (event) => {
      lastEventId = event.id ?? lastEventId
      render(event.data)
    },
    // mid-stream drop: reconnect from the last processed id
    onError: () => setTimeout(connect, 1000),
  })

connect()`
</script>

<template>
  <section class="status-playground sse-resume" aria-label="SSE resume demo">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">Live demo · SSE resume</p>
        <h2>Drop the connection. Lose nothing.</h2>
        <p class="status-playground-lead">
          Real <code>tanstack-fetch/sse</code> client. The server is
          <strong>simulated in your browser</strong>: it reads <code>Last-Event-ID</code> and
          continues after it. Start the stream, cut the connection mid-way, and watch the ids.
        </p>
      </div>
    </header>

    <div class="live-query-actions">
      <button type="button" class="status-chip tone-ok" :disabled="running" @click="start">
        Start stream
      </button>
      <button type="button" class="status-chip tone-server" :disabled="!running" @click="cut">
        Cut connection
      </button>
      <button type="button" class="status-chip" @click="reset">Reset</button>
      <label class="sse-resume-toggle">
        <input v-model="resume" type="checkbox" :disabled="running" />
        Send Last-Event-ID on reconnect
      </label>
    </div>

    <p class="status-result" :data-busy="running ? '1' : '0'" role="status" aria-live="polite">
      {{ status }}
    </p>

    <div class="sse-resume-stats">
      <span>Received <strong>{{ uniqueCount }}</strong> / {{ TOTAL }}</span>
      <span>Connections <strong>{{ attempts.length }}</strong></span>
      <span :class="{ bad: duplicates > 0 }">Duplicates <strong>{{ duplicates }}</strong></span>
    </div>

    <ol class="sse-resume-grid" aria-label="Event ids received">
      <li
        v-for="id in cells"
        :key="id"
        :class="[
          received[id] ? `conn-${(received[id][0] - 1) % 4}` : 'empty',
          { dup: (received[id]?.length ?? 0) > 1 },
        ]"
        :title="received[id] ? `id ${id} · connection ${received[id].join(', ')}` : `id ${id} · not yet`"
      >
        {{ id }}<sup v-if="(received[id]?.length ?? 0) > 1">×{{ received[id].length }}</sup>
      </li>
    </ol>

    <ol v-if="attempts.length" class="sse-resume-timeline" aria-label="Connection timeline">
      <li v-for="a in attempts" :key="a.conn" :class="`conn-${(a.conn - 1) % 4}`">
        <strong>#{{ a.conn }}</strong>
        <code>Last-Event-ID: {{ a.sentId ?? '—' }}</code>
        <span>server starts at id {{ a.firstServed }}</span>
        <em :data-end="a.end">{{ a.end }}</em>
      </li>
    </ol>

    <pre class="status-code"><code>{{ snippet }}</code></pre>
  </section>
</template>

<style scoped>
.sse-resume-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
.sse-resume-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin: 0.75rem 0;
}
.sse-resume-stats strong {
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}
.sse-resume-stats .bad strong {
  color: var(--vp-c-danger-1);
}
.sse-resume-grid,
.sse-resume-timeline {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0;
}
.sse-resume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(2.6rem, 1fr));
  gap: 0.35rem;
}
.sse-resume-grid li {
  position: relative;
  margin: 0;
  padding: 0.45rem 0;
  text-align: center;
  font: 600 0.8rem var(--vp-font-family-mono);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  transition: background-color 0.2s, border-color 0.2s;
}
.sse-resume-grid li.empty {
  color: var(--vp-c-text-3);
  border-style: dashed;
}
.sse-resume-grid li.dup {
  border-color: var(--vp-c-danger-1);
  box-shadow: 0 0 0 1px var(--vp-c-danger-1);
}
.sse-resume-grid sup {
  position: absolute;
  top: -0.45rem;
  right: -0.3rem;
  font-size: 0.65rem;
  padding: 0 0.25rem;
  border-radius: 4px;
  background: var(--vp-c-danger-1);
  color: #fff;
}
.conn-0 { --c: var(--vp-c-brand-1); }
.conn-1 { --c: var(--vp-c-green-1, #10b981); }
.conn-2 { --c: var(--vp-c-purple-1, #8b5cf6); }
.conn-3 { --c: var(--vp-c-yellow-1, #eab308); }
.sse-resume-grid li[class*='conn-'] {
  border-color: var(--c);
  background: color-mix(in srgb, var(--c) 16%, transparent);
  color: var(--vp-c-text-1);
}
.sse-resume-timeline li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin: 0.3rem 0;
  padding: 0.4rem 0.6rem;
  border-left: 3px solid var(--c);
  font-size: 0.82rem;
  background: var(--vp-c-bg-soft);
  border-radius: 0 6px 6px 0;
}
.sse-resume-timeline em {
  margin-left: auto;
  font-style: normal;
  color: var(--vp-c-text-2);
}
.sse-resume-timeline em[data-end='dropped'] {
  color: var(--vp-c-danger-1);
}
@media (prefers-reduced-motion: reduce) {
  .sse-resume-grid li {
    transition: none;
  }
}
</style>
