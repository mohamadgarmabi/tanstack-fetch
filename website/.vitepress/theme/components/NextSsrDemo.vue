<script setup lang="ts">
import { ref } from 'vue'
import { createFetch } from 'tanstack-fetch'

type StepLog = { id: number; text: string }

const logs = ref<StepLog[]>([])
const busy = ref(false)
let logId = 0

const push = (text: string) => {
  logs.value = [{ id: ++logId, text }, ...logs.value].slice(0, 10)
}

const createMockFetch = (label: string): typeof fetch => {
  return async (input, init) => {
    await new Promise((resolve) => setTimeout(resolve, 220))
    const headers = new Headers(init?.headers)
    push(
      `${label} → ${String(input).replace('https://demo.tanstack-fetch.local', '')} · cookie=${headers.get('cookie') ?? '∅'} · auth=${headers.get('authorization') ?? '∅'} · x-request-id=${headers.get('x-request-id') ?? '∅'}`,
    )
    return new Response(JSON.stringify([{ id: '1', name: 'SSR Ada' }]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

const runServerPrefetch = async () => {
  busy.value = true
  try {
    // Mirrors Next.js App Router: cookies() → incoming → ssr-forward
    const serverApi = createFetch({
      baseUrl: 'https://demo.tanstack-fetch.local',
      source: 'ssr',
      plugins: ['ssr-forward', 'trace'],
      fetch: createMockFetch('SSR'),
      incoming: {
        cookie: 'session=demo-user; theme=dark',
        authorization: 'Bearer server-token',
        requestId: 'req-from-next',
      },
    })
    push('server: createFetch({ source: "ssr", plugins: ["ssr-forward"] })')
    const data = await serverApi.get('/users')
    push(`server prefetch ok · ${JSON.stringify(data)}`)
  } finally {
    busy.value = false
  }
}

const runBrowserClient = async () => {
  busy.value = true
  try {
    const browserApi = createFetch({
      baseUrl: 'https://demo.tanstack-fetch.local',
      source: 'browser',
      plugins: ['ssr-forward', 'trace'],
      fetch: createMockFetch('Browser'),
      credentials: 'include',
      // ssr-forward no-ops in browser — cookies come from the document
    })
    push('browser: createFetch({ source: "browser" }) — ssr-forward skips')
    const data = await browserApi.get('/users')
    push(`client hydrate ok · ${JSON.stringify(data)}`)
  } finally {
    busy.value = false
  }
}

const clearLogs = () => {
  logs.value = []
}

const snippet = `// app/users/page.tsx (Next.js App Router)
import { cookies } from 'next/headers'
import { createFetch } from 'tanstack-fetch'

const createServerApi = async () =>
  createFetch({
    baseUrl: process.env.API_URL!,
    source: 'ssr',
    plugins: ['ssr-forward', 'trace'],
    incoming: async () => ({
      cookie: (await cookies()).toString(),
    }),
  })

await queryClient.prefetchQuery({
  queryKey: ['users'],
  queryFn: async () => (await createServerApi()).get('/users'),
})`
</script>

<template>
  <section class="status-playground" aria-label="Live Next.js SSR demo">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">Live demo · Next.js SSR</p>
        <h2>ssr-forward cookie / auth</h2>
        <p class="status-playground-lead">
          Real <code>createFetch</code> with <code>source: 'ssr'</code> + <code>ssr-forward</code> —
          watch headers get attached (then skipped in browser).
        </p>
      </div>
      <button type="button" class="status-clear" :disabled="busy" @click="clearLogs">
        Clear log
      </button>
    </header>

    <div class="live-query-actions">
      <button type="button" class="status-chip tone-ok" :disabled="busy" @click="runServerPrefetch">
        1 · Server prefetch
      </button>
      <button
        type="button"
        class="status-chip tone-client"
        :disabled="busy"
        @click="runBrowserClient"
      >
        2 · Browser client
      </button>
    </div>

    <div class="status-log" aria-live="polite">
      <h3>Request log</h3>
      <ul v-if="logs.length">
        <li v-for="entry in logs" :key="entry.id" class="kind-handler">{{ entry.text }}</li>
      </ul>
      <p v-else class="status-empty">
        Run server prefetch to see forwarded Cookie / Authorization.
      </p>
    </div>

    <pre class="status-code"><code>{{ snippet }}</code></pre>
  </section>
</template>
