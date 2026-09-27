<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { createFetch, isFetchError } from 'tanstack-fetch'
import { createFetch as createSseFetch } from 'tanstack-fetch/sse'
import { createTRPCFetch } from 'tanstack-fetch/trpc'
import { createDevtools, mountDevtools } from 'tanstack-fetch/devtools'
import type { DevtoolsKindFlags } from 'tanstack-fetch/devtools'

type Tick = { n: number; at: string }

const log = ref('Ready — open DevTools (Shift+D) and fire a sample.')
const busy = ref(false)

const flags = reactive<DevtoolsKindFlags>({
  http: true,
  sse: true,
  ssr: true,
  trpc: true,
})

const encoder = new TextEncoder()
let sseTimer: ReturnType<typeof setInterval> | null = null
let sseSub: { close: () => void } | null = null
let panel: { destroy: () => void; open: () => void } | null = null

const clearSseTimer = () => {
  if (sseTimer) {
    clearInterval(sseTimer)
    sseTimer = null
  }
}

const buildSseStream = () => {
  let n = 0
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      controller.enqueue(encoder.encode(': connected\n\n'))
      sseTimer = setInterval(() => {
        n += 1
        const payload = JSON.stringify({ n, at: new Date().toISOString() })
        controller.enqueue(encoder.encode(`id: ${n}\nevent: tick\ndata: ${payload}\n\n`))
        if (n >= 5) {
          clearSseTimer()
          controller.close()
        }
      }, 350)
    },
    cancel: () => clearSseTimer(),
  })
}

const mockFetch: typeof fetch = async (input, init) => {
  const url = String(input)
  await new Promise((r) => setTimeout(r, 80 + Math.random() * 120))

  if (url.includes('/orders/stream') || url.includes('/events')) {
    return new Response(buildSseStream(), {
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
      },
    })
  }

  if (url.includes('/api/trpc')) {
    const ok = !(init?.method === 'POST' && url.includes('fail'))
    return new Response(JSON.stringify([{ result: { data: { hello: 'trpc', ok } } }]), {
      status: ok ? 200 : 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (url.includes('/missing')) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'Missing' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (url.includes('/files')) {
    let name = 'demo.png'
    let size = 0
    const body = init?.body
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      const entry = body.get('file')
      if (entry instanceof File) {
        name = entry.name
        size = entry.size
      } else if (typeof Blob !== 'undefined' && entry instanceof Blob) {
        name = 'blob'
        size = entry.size
      }
    }
    return new Response(
      JSON.stringify({
        id: `up_${Date.now()}`,
        url: `https://cdn.demo.local/avatars/${encodeURIComponent(name)}`,
        name,
        size,
      }),
      { status: 201, headers: { 'content-type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({
      ok: true,
      path: url,
      echo: init?.body ? String(init.body).slice(0, 120) : null,
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json', 'content-length': '96' },
    },
  )
}

const devtools = createDevtools({
  http: true,
  sse: true,
  ssr: true,
  trpc: true,
  maxEntries: 100,
})

const httpApi = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  plugins: ['trace'],
  interceptors: [devtools.interceptor],
  getToken: () => 'demo-browser-token',
  maxRetries: 0,
})

const ssrApi = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  source: 'ssr',
  plugins: ['trace', 'ssr-forward'],
  interceptors: [devtools.interceptor],
  incoming: { cookie: 'session=demo-ssr', requestId: 'ssr-preview-1' },
  maxRetries: 0,
})

const sseApi = createSseFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  plugins: ['trace', 'sse-resume'],
  interceptors: [devtools.interceptor],
  getToken: () => 'demo-sse-token',
  maxRetries: 0,
})

const trpcFetch = createTRPCFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  plugins: ['trace'],
  interceptors: [devtools.interceptor],
  getToken: () => 'demo-trpc-token',
  maxRetries: 0,
})

const applyFlags = () => {
  devtools.setFlags({ ...flags })
}

const flagEntries = computed(() =>
  (Object.keys(flags) as Array<keyof DevtoolsKindFlags>).map((key) => ({
    key,
    label: key.toUpperCase(),
    onToggle: () => {
      flags[key] = !flags[key]
      applyFlags()
    },
  })),
)

onMounted(() => {
  panel = mountDevtools({ store: devtools.store, open: true })
  panel.open()
})

onBeforeUnmount(() => {
  sseSub?.close()
  clearSseTimer()
  panel?.destroy()
  panel = null
})

const runHttp = async () => {
  if (busy.value) return
  busy.value = true
  try {
    const user = await httpApi.get<{ ok: boolean }>('/users/:id', {
      params: { id: '42' },
      query: { page: 1, include: 'profile' },
    })
    log.value = `HTTP GET ok · ${JSON.stringify(user).slice(0, 80)}`
    await httpApi.post('/orders', { body: { item: 'gold', qty: 2 } })
    log.value = 'HTTP GET + POST recorded — inspect in DevTools'
  } catch (error) {
    log.value = isFetchError(error) ? `HTTP error ${error.status}` : 'HTTP failed'
  } finally {
    busy.value = false
  }
}

const runHttpError = async () => {
  if (busy.value) return
  busy.value = true
  try {
    await httpApi.get('/missing')
  } catch (error) {
    log.value = isFetchError(error) ? `HTTP 404 recorded · ${error.message}` : 'HTTP error recorded'
  } finally {
    busy.value = false
  }
}

const runSsr = async () => {
  if (busy.value) return
  busy.value = true
  try {
    await ssrApi.get('/me', { query: { from: 'rsc' } })
    log.value = 'SSR request with cookie forward — see SSR tab + Incoming'
  } catch (error) {
    log.value = isFetchError(error) ? `SSR error ${error.status}` : 'SSR failed'
  } finally {
    busy.value = false
  }
}

const runSse = () => {
  sseSub?.close()
  clearSseTimer()
  log.value = 'SSE connecting…'
  sseSub = sseApi.sse<Tick>('/orders/stream', {
    onOpen: () => {
      log.value = 'SSE open — event list grows in the detail panel'
    },
    onMessage: (data) => {
      log.value = `SSE tick #${data.n} · see events list in DevTools`
    },
    onError: (error) => {
      log.value = isFetchError(error) ? `SSE error ${error.status}` : 'SSE error'
    },
    onClose: () => {
      log.value = 'SSE stream closed'
      sseSub = null
    },
  })
}

const runTrpc = async () => {
  if (busy.value) return
  busy.value = true
  try {
    const response = await trpcFetch('https://demo.tanstack-fetch.local/api/trpc/hello', {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    })
    log.value = `tRPC fetch ${response.status} — success path hits onResponse`
  } catch (error) {
    log.value = error instanceof Error ? error.message : 'tRPC failed'
  } finally {
    busy.value = false
  }
}

const runUpload = async () => {
  if (busy.value) return
  busy.value = true
  try {
    const file = new File(['devtools-demo-upload'], 'avatar.png', { type: 'image/png' })
    const uploaded = await httpApi.upload<{ id: string; url: string; name: string; size: number }>(
      '/files',
      {
        file,
        fieldName: 'file',
        fields: { folder: 'avatars', public: true },
      },
    )
    log.value = `Upload ok · ${uploaded.name} (${uploaded.size} B) · ${uploaded.url}`
  } catch (error) {
    log.value = isFetchError(error) ? `Upload error ${error.status}` : 'Upload failed'
  } finally {
    busy.value = false
  }
}

const clearPanel = () => {
  devtools.store.clear()
  log.value = 'DevTools cleared'
}
</script>

<template>
  <div class="devtools-demo status-playground">
    <p class="status-playground-eyebrow">
      Alt+Shift+F (⌥⇧F) · caller file in list · click graph → Cursor / Zed / VS Code
    </p>
    <p class="devtools-demo-lead">
      Simple dock: request list, SSE event list, and a call graph showing where the request was
      fired.
    </p>

    <div class="devtools-demo-flags">
      <label v-for="item in flagEntries" :key="item.key" class="devtools-demo-flag">
        <input type="checkbox" :checked="flags[item.key]" @change="item.onToggle" />
        {{ item.label }}
      </label>
    </div>

    <div class="status-playground-grid">
      <button type="button" class="status-chip tone-ok" :disabled="busy" @click="runHttp">
        HTTP get/post
      </button>
      <button type="button" class="status-chip tone-client" :disabled="busy" @click="runHttpError">
        HTTP 404
      </button>
      <button type="button" class="status-chip tone-auth" :disabled="busy" @click="runSsr">
        SSR + cookies
      </button>
      <button type="button" class="status-chip tone-rate" @click="runSse">SSE stream</button>
      <button type="button" class="status-chip tone-server" :disabled="busy" @click="runTrpc">
        tRPC fetch
      </button>
      <button type="button" class="status-chip tone-ok" :disabled="busy" @click="runUpload">
        Upload
      </button>
      <button type="button" class="status-chip" @click="clearPanel">Clear panel</button>
    </div>

    <p class="status-playground-result">{{ log }}</p>
  </div>
</template>

<style scoped>
.devtools-demo-lead {
  margin: 0 0 1rem;
  color: var(--vp-c-text-2);
  max-width: 44rem;
}
.devtools-demo-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.1rem;
  margin-bottom: 1rem;
}
.devtools-demo-flag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
</style>
