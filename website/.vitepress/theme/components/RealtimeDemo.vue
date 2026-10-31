<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { createFetch } from 'tanstack-fetch/live'
import type { WsSocket } from 'tanstack-fetch'

/**
 * Real `tanstack-fetch/live` code against in-page mock servers:
 * `ws` → chat over a fake WebSocket, `transport` → game state over fake WebTransport datagrams,
 * `stream` → LLM-style NDJSON over a mock fetch.
 */
const props = defineProps<{ kind: 'ws' | 'transport' | 'stream' }>()

type LogLine = { id: number; dir: 'in' | 'out' | 'sys'; text: string }

const status = ref('disconnected')
const log = ref<LogLine[]>([])
const url = ref('')
let logId = 0
const push = (dir: LogLine['dir'], text: string) => {
  log.value = [{ id: (logId += 1), dir, text }, ...log.value].slice(0, 8)
}

let tokenVersion = 0
const getToken = () => `demo-token-v${(tokenVersion += 1)}`

/* ---------- WebSocket: echo chat server ---------- */

type FakeSocket = {
  readyState: number
  onopen: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  send: (frame: string) => void
  close: () => void
}
let fakeSocket: FakeSocket | null = null

const wsApi = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.dev',
  getToken,
  createWebSocket: (target) => {
    url.value = target
    const socket: FakeSocket = {
      readyState: 0,
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      send: (frame) => {
        const { text } = JSON.parse(frame) as { text: string }
        setTimeout(() => {
          socket.onmessage?.({
            data: JSON.stringify({ user: 'bot', text: `echo: ${text}` }),
          } as MessageEvent)
        }, 350)
      },
      close: () => {
        socket.readyState = 3
      },
    }
    setTimeout(() => {
      socket.readyState = 1
      socket.onopen?.(new Event('open'))
    }, 400)
    fakeSocket = socket
    return socket as unknown as WebSocket
  },
})

let chat: WsSocket<{ text: string }> | null = null
const draft = ref('hi')

const connectWs = () => {
  chat?.close()
  log.value = []
  status.value = 'connecting'
  chat = wsApi.ws<{ user: string; text: string }, { id: number }, { text: string }>('/rooms/:id', {
    params: { id: 7 },
    authIn: 'query',
    reconnect: { retries: 3, delayMs: 600 },
    onOpen: () => {
      status.value = 'connected'
      push('sys', 'open')
    },
    onMessage: (message) => push('in', `${message.user}: ${message.text}`),
    onReconnect: (attempt) => {
      status.value = 'connecting'
      push('sys', `reconnect #${attempt} — getToken() runs again`)
    },
    onClose: () => {
      status.value = 'disconnected'
      push('sys', 'closed')
      chat = null
    },
  })
}

const sendWs = () => {
  if (!chat || !draft.value.trim()) return
  chat.send({ text: draft.value })
  push('out', `me: ${draft.value}`)
}

const dropWs = () => {
  if (!fakeSocket) return
  push('sys', 'server dropped the connection (1006)')
  fakeSocket.readyState = 3
  fakeSocket.onclose?.({ code: 1006, reason: 'network' } as CloseEvent)
}

/* ---------- WebTransport: game-state datagrams ---------- */

const dot = ref({ x: 50, y: 50 })
const datagrams = ref(0)
let tick: ReturnType<typeof setInterval> | null = null
const encoder = new TextEncoder()

const transportApi = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.dev',
  getToken,
  createWebTransport: (target) => {
    url.value = target
    let phase = 0
    let resolveClosed: (info: WebTransportCloseInfo) => void = () => undefined
    const readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        tick = setInterval(() => {
          phase += 0.12
          const state = { x: 50 + Math.cos(phase) * 38, y: 50 + Math.sin(phase * 2) * 30 }
          controller.enqueue(encoder.encode(JSON.stringify(state)))
        }, 60)
      },
      cancel: () => {
        if (tick) clearInterval(tick)
      },
    })
    const writable = new WritableStream<Uint8Array>({
      write: (chunk) => {
        const input = JSON.parse(new TextDecoder().decode(chunk)) as { boost: number }
        phase += input.boost
      },
    })
    return {
      ready: new Promise<void>((resolve) => setTimeout(resolve, 300)),
      closed: new Promise<WebTransportCloseInfo>((resolve) => (resolveClosed = resolve)),
      datagrams: { readable, writable },
      close: (info: WebTransportCloseInfo) => {
        if (tick) clearInterval(tick)
        resolveClosed(info)
      },
    } as unknown as WebTransport
  },
})

let game: WsSocket<{ boost: number }> | null = null

const connectTransport = () => {
  game?.close()
  datagrams.value = 0
  status.value = 'connecting'
  game = transportApi.transport<{ x: number; y: number }, { id: number }, { boost: number }>('/game/:id', {
    params: { id: 1 },
    authIn: 'query',
    onOpen: () => {
      status.value = 'connected'
    },
    onMessage: (state) => {
      dot.value = state
      datagrams.value += 1
    },
    onClose: () => {
      status.value = 'disconnected'
      game = null
    },
  })
}

/* ---------- NDJSON: LLM token stream ---------- */

const answer = ref('')
const request = ref('')
let abort: AbortController | null = null
const TOKENS = [
  'tanstack-fetch ',
  'streams ',
  'NDJSON ',
  'line ',
  'by ',
  'line — ',
  'POST body, ',
  'Authorization ',
  'header, ',
  'interceptors ',
  'and ',
  'refresh-token ',
  'included.',
]

const streamApi = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.dev',
  getToken: () => 'demo-token',
  fetch: async (input, init) => {
    const headers = new Headers(init?.headers)
    request.value = `${init?.method} ${new URL(String(input)).pathname} · authorization: ${headers.get('authorization')} · accept: ${headers.get('accept')}`
    let index = 0
    let timer: ReturnType<typeof setInterval> | undefined
    const body = new ReadableStream<Uint8Array>({
      start: (controller) => {
        timer = setInterval(() => {
          if (index >= TOKENS.length) {
            clearInterval(timer)
            controller.close()
            return
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ text: TOKENS[index] })}\n`))
          index += 1
        }, 110)
      },
      cancel: () => clearInterval(timer),
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'application/x-ndjson' } })
  },
})

const ask = async () => {
  abort?.abort()
  abort = new AbortController()
  answer.value = ''
  status.value = 'streaming'
  try {
    for await (const chunk of streamApi.stream<{ text: string }>('/chat', {
      body: { prompt: 'What does api.stream do?' },
      signal: abort.signal,
    })) {
      answer.value += chunk.text
    }
    status.value = 'done'
  } catch {
    status.value = 'stopped'
  }
}

/* ---------- shared ---------- */

const connected = computed(() => status.value === 'connected' || status.value === 'streaming')

const stopAll = () => {
  chat?.close()
  game?.close()
  abort?.abort()
  if (tick) clearInterval(tick)
}
onBeforeUnmount(stopAll)

const COPY = {
  ws: {
    eyebrow: 'Live demo · WebSocket',
    title: 'useWs — auth + reconnect',
    lead: 'Chat against a mock socket. Send before it opens (queued), then drop the connection: it reconnects and getToken() runs again, so the URL gets a fresh token.',
    snippet: `import { createFetch } from 'tanstack-fetch/live'
import { useWs } from 'tanstack-fetch/react'

const api = createFetch({ baseUrl, getToken })

const ChatRoom = ({ id }: { id: number }) => {
  const { data, status, send, close } = useWs<ChatMessage, { id: number }>('/rooms/:id', {
    client: api,
    params: { id },
    authIn: 'query', // browsers can't send WS headers
    reconnect: { retries: 3, delayMs: 600 },
  })

  return (
    <>
      <p>{status} · {data?.text}</p>
      <button onClick={() => send({ text: 'hi' })}>Send</button>
      <button onClick={close}>Close</button>
    </>
  )
}`,
  },
  transport: {
    eyebrow: 'Live demo · WebTransport',
    title: "useWs({ transport: 'webtransport' })",
    lead: 'Game state streams in as unreliable datagrams (newest value wins). Same API as api.ws: send input back with send().',
    snippet: `import { useWs } from 'tanstack-fetch/react'

const Game = () => {
  const { data: state, status, send } = useWs<GameState, { id: number }, Input>('/game/:id', {
    client: api,
    params: { id: 1 },
    authIn: 'query',
    transport: 'webtransport', // HTTP/3 datagrams
  })

  return (
    <Board dot={state} live={status === 'connected'}
      onBoost={() => send({ boost: 1.5 })} />
  )
}`,
  },
  stream: {
    eyebrow: 'Live demo · NDJSON',
    title: 'api.stream + streamedQuery',
    lead: 'A POST with a body and an Authorization header, read line by line. EventSource cannot do either.',
    snippet: `import {
  experimental_streamedQuery as streamedQuery,
  useQuery,
} from '@tanstack/react-query'

const Answer = ({ prompt }: { prompt: string }) => {
  const { data: tokens = [], fetchStatus, refetch } = useQuery({
    queryKey: ['chat', prompt],
    queryFn: streamedQuery({
      streamFn: ({ signal }) =>
        api.stream<Token>('/chat', { body: { prompt }, signal }),
    }),
    enabled: false,
  })

  return (
    <>
      <button onClick={() => refetch()}>Ask</button>
      <p>{tokens.map((t) => t.text).join('')}</p>
      {fetchStatus === 'fetching' && <span>streaming…</span>}
    </>
  )
}`,
  },
} as const
const copy = computed(() => COPY[props.kind])
</script>

<template>
  <section class="status-playground realtime-demo" :aria-label="copy.title">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">{{ copy.eyebrow }}</p>
        <h2>{{ copy.title }}</h2>
        <p class="status-playground-lead">{{ copy.lead }}</p>
      </div>
    </header>

    <div class="live-query-actions">
      <template v-if="kind === 'ws'">
        <button type="button" class="status-chip tone-ok" :disabled="!!chat" @click="connectWs">
          Connect
        </button>
        <input
          v-model="draft"
          class="realtime-input"
          aria-label="Message"
          :disabled="!chat"
          @keydown.enter="sendWs"
        />
        <button type="button" class="status-chip tone-client" :disabled="!chat" @click="sendWs">
          Send
        </button>
        <button
          type="button"
          class="status-chip tone-auth"
          :disabled="status !== 'connected'"
          @click="dropWs"
        >
          Drop connection
        </button>
        <button
          type="button"
          class="status-chip tone-rate"
          :disabled="!chat"
          @click="chat?.close()"
        >
          Close
        </button>
      </template>

      <template v-else-if="kind === 'transport'">
        <button
          type="button"
          class="status-chip tone-ok"
          :disabled="!!game"
          @click="connectTransport"
        >
          Connect
        </button>
        <button
          type="button"
          class="status-chip tone-client"
          :disabled="!connected"
          @click="game?.send({ boost: 1.5 })"
        >
          send({ boost })
        </button>
        <button
          type="button"
          class="status-chip tone-rate"
          :disabled="!game"
          @click="game?.close()"
        >
          Close
        </button>
      </template>

      <template v-else>
        <button type="button" class="status-chip tone-ok" :disabled="connected" @click="ask">
          Ask
        </button>
        <button
          type="button"
          class="status-chip tone-rate"
          :disabled="!connected"
          @click="abort?.abort()"
        >
          Stop
        </button>
      </template>
    </div>

    <p class="status-result" :data-busy="connected ? '1' : '0'">
      status: <strong>{{ status }}</strong>
      <template v-if="kind !== 'stream' && url"><br />url: {{ url }}</template>
      <template v-if="kind === 'transport' && datagrams"> · {{ datagrams }} datagrams</template>
      <template v-if="kind === 'stream' && request"><br />{{ request }}</template>
    </p>

    <ul v-if="kind === 'ws' && log.length" class="realtime-log">
      <li v-for="line in log" :key="line.id" :data-dir="line.dir">{{ line.text }}</li>
    </ul>

    <div v-if="kind === 'transport'" class="realtime-field" aria-hidden="true">
      <span class="realtime-dot" :style="{ left: `${dot.x}%`, top: `${dot.y}%` }" />
    </div>

    <p v-if="kind === 'stream' && answer" class="realtime-answer">{{ answer }}</p>

    <pre class="status-code"><code>{{ copy.snippet }}</code></pre>
  </section>
</template>

<style scoped>
.realtime-input {
  min-width: 8rem;
  flex: 1;
  max-width: 14rem;
  padding: 0.38rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
}

.realtime-log {
  margin: 0 0 1rem !important;
  padding: 0.7rem 0.9rem !important;
  list-style: none;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
}

.realtime-log li {
  margin: 0.15rem 0 !important;
}

.realtime-log li[data-dir='in'] {
  color: #86efac;
}

.realtime-log li[data-dir='out'] {
  color: #fdba74;
}

.realtime-log li[data-dir='sys'] {
  color: var(--vp-c-text-3);
}

.realtime-field {
  position: relative;
  height: 150px;
  margin-bottom: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 122, 24, 0.16);
  background:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px) 0 0 / 20px 20px,
    rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.realtime-dot {
  position: absolute;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  background: #ff7a18;
  box-shadow: 0 0 16px rgba(255, 122, 24, 0.8);
}

.realtime-answer {
  margin: 0 0 1rem !important;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  line-height: 1.55;
}
</style>
