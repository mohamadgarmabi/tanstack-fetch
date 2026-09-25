<script setup lang="ts">
import { computed, ref } from 'vue'
import { createFetch, isFetchError } from 'tanstack-fetch'

type User = { id: string; name: string }
type QueryState = 'idle' | 'pending' | 'success' | 'error'

const users = ref<User[]>([])
const queryState = ref<QueryState>('idle')
const queryError = ref('')
const mutationPending = ref(false)
const mutationNote = ref('')
const nameInput = ref('Lin')

const mockFetch: typeof fetch = async (input, init) => {
  await new Promise((resolve) => setTimeout(resolve, 320))
  const url = String(input)
  const method = (init?.method ?? 'GET').toUpperCase()

  if (method === 'POST' && url.includes('/users')) {
    const body = JSON.parse(String(init?.body ?? '{}')) as { name?: string }
    return new Response(JSON.stringify({ id: String(Date.now()), name: body.name ?? 'Anon' }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (url.includes('/boom')) {
    return new Response(JSON.stringify({ code: 'SERVER', message: 'Upstream failed' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify([
      { id: '1', name: 'Ada' },
      { id: '2', name: 'Grace' },
    ]),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

const api = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  plugins: [],
  maxRetries: 0,
})

const runQuery = async (path = '/users') => {
  queryState.value = 'pending'
  queryError.value = ''
  try {
    // same shape as TanStack Query queryFn
    users.value = await api.get<User[]>(path)
    queryState.value = 'success'
  } catch (error) {
    users.value = []
    queryState.value = 'error'
    queryError.value = isFetchError(error)
      ? `${error.status} · ${error.code} · ${error.message}`
      : 'Unknown error'
  }
}

const runMutation = async () => {
  mutationPending.value = true
  mutationNote.value = ''
  try {
    const created = await api.post<User>('/users', { body: { name: nameInput.value } })
    users.value = [...users.value, created]
    queryState.value = 'success'
    mutationNote.value = `useMutation success · invalidated list (+ ${created.name})`
  } catch (error) {
    mutationNote.value = isFetchError(error) ? `mutation error ${error.status}` : 'mutation error'
  } finally {
    mutationPending.value = false
  }
}

const statusLabel = computed(() => {
  if (queryState.value === 'pending') return 'isPending…'
  if (queryState.value === 'error') return `isError · ${queryError.value}`
  if (queryState.value === 'success') return `isSuccess · ${users.value.length} rows`
  return 'idle — click useQuery'
})

const snippet = `const api = createFetch({ baseUrl })

// React Query
useQuery({
  queryKey: ['users'],
  queryFn: ({ signal }) => api.get<User[]>('/users', { signal }),
})

useMutation({
  mutationFn: (body) => api.post<User>('/users', { body }),
})`
</script>

<template>
  <section class="status-playground" aria-label="Live React Query demo">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">Live demo · React / TanStack Query</p>
        <h2>useQuery + useMutation shape</h2>
        <p class="status-playground-lead">
          Real <code>createFetch</code> calls — same <code>queryFn</code> /
          <code>mutationFn</code> contract your React app uses.
        </p>
      </div>
    </header>

    <div class="live-query-actions">
      <button type="button" class="status-chip tone-ok" @click="runQuery('/users')">
        useQuery GET /users
      </button>
      <button type="button" class="status-chip tone-server" @click="runQuery('/boom')">
        useQuery → 503
      </button>
      <button
        type="button"
        class="status-chip tone-client"
        :disabled="mutationPending"
        @click="runMutation"
      >
        useMutation POST
      </button>
    </div>

    <label class="demo-field">
      <span>name</span>
      <input v-model="nameInput" type="text" />
    </label>

    <p class="status-result">{{ statusLabel }}</p>
    <p v-if="mutationNote" class="status-result demo-note">{{ mutationNote }}</p>

    <ul v-if="users.length" class="live-query-users">
      <li v-for="user in users" :key="user.id">{{ user.name }}</li>
    </ul>

    <pre class="status-code"><code>{{ snippet }}</code></pre>
  </section>
</template>
