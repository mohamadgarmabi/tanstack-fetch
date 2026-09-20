<script setup lang="ts">
import { computed, ref } from 'vue'
import { createFetch, isFetchError } from 'tanstack-fetch'

type User = { id: string; name: string }

const loading = ref(false)
const output = ref('Click Run — this calls createFetch against a mock API')
const users = ref<User[]>([])

const mockFetch: typeof fetch = async (input) => {
  const url = String(input)
  await new Promise((resolve) => setTimeout(resolve, 280))

  if (url.includes('/users/missing')) {
    return new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'User missing' }), {
      status: 404,
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
  onNotFound: ({ error }) => {
    output.value = `onNotFound fired · ${error.message}`
  },
})

const runSuccess = async () => {
  loading.value = true
  try {
    users.value = await api.get<User[]>('/users')
    output.value = `queryFn-style success · ${users.value.length} users`
  } catch (error) {
    users.value = []
    output.value = isFetchError(error) ? `FetchError ${error.status}` : 'Error'
  } finally {
    loading.value = false
  }
}

const runNotFound = async () => {
  loading.value = true
  users.value = []
  try {
    await api.get('/users/missing')
    output.value = 'unexpected success'
  } catch (error) {
    output.value = isFetchError(error)
      ? `threw FetchError ${error.status} · ${error.code}`
      : 'Error'
  } finally {
    loading.value = false
  }
}

const snippet = computed(
  () => `const api = createFetch({ baseUrl, fetch: mockFetch })

// same shape as TanStack Query queryFn
const users = await api.get<User[]>('/users')
`,
)
</script>

<template>
  <section class="live-query-demo" aria-label="Live queryFn demo">
    <header>
      <p class="status-playground-eyebrow">Live demo · queryFn shape</p>
      <h2>Returns data · throws on error</h2>
    </header>

    <div class="live-query-actions">
      <button type="button" class="status-chip tone-ok" :disabled="loading" @click="runSuccess">
        Run GET /users
      </button>
      <button
        type="button"
        class="status-chip tone-client"
        :disabled="loading"
        @click="runNotFound"
      >
        Run GET 404
      </button>
    </div>

    <p class="status-result">{{ output }}</p>

    <ul v-if="users.length" class="live-query-users">
      <li v-for="user in users" :key="user.id">{{ user.name }}</li>
    </ul>

    <pre class="status-code"><code>{{ snippet }}</code></pre>
  </section>
</template>
