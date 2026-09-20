<script setup lang="ts">
import { computed, ref } from 'vue'
import { createFetch, isFetchError } from 'tanstack-fetch'

type UploadResponse = { id: string; url: string; name: string; size: number }

const fileInput = ref<HTMLInputElement | null>(null)
const selectedName = ref('No file selected')
const selectedFile = ref<File | null>(null)
const progress = ref(0)
const busy = ref(false)
const result = ref('Pick a file and upload — real api.upload() + mock fetch')
const folder = ref('avatars')

const mockFetch: typeof fetch = async (input, init) => {
  await new Promise((resolve) => setTimeout(resolve, 900))
  const body = init?.body
  let name = 'file'
  let size = 0
  if (body instanceof FormData) {
    const entry = body.get('file')
    if (entry instanceof File) {
      name = entry.name
      size = entry.size
    } else if (entry instanceof Blob) {
      size = entry.size
      name = 'blob'
    }
  }
  return new Response(
    JSON.stringify({
      id: `up_${Date.now()}`,
      url: `https://cdn.demo.local/${folder.value}/${encodeURIComponent(name)}`,
      name,
      size,
    }),
    { status: 201, headers: { 'content-type': 'application/json' } },
  )
}

const api = createFetch({
  baseUrl: 'https://demo.tanstack-fetch.local',
  fetch: mockFetch,
  plugins: [],
})

const onFileChange = () => {
  const file = fileInput.value?.files?.[0] ?? null
  selectedFile.value = file
  selectedName.value = file ? `${file.name} (${file.size} bytes)` : 'No file selected'
  progress.value = 0
  result.value = file ? 'Ready to upload' : 'Pick a file and upload — real api.upload()'
}

const runUpload = async () => {
  if (!selectedFile.value || busy.value) {
    return
  }
  busy.value = true
  progress.value = 0
  result.value = 'Uploading…'
  const tick = window.setInterval(() => {
    if (progress.value < 90) {
      progress.value += 8
    }
  }, 80)

  try {
    // Real createFetch.upload — mock fetch (progress bar is demo-side while request runs;
    // production apps pass onUploadProgress for XHR progress events).
    const uploaded = await api.upload<UploadResponse>('/files', {
      file: selectedFile.value,
      fieldName: 'file',
      fields: { folder: folder.value, public: true },
    })
    progress.value = 100
    result.value = `upload ok · ${uploaded.url}`
  } catch (error) {
    progress.value = 0
    result.value = isFetchError(error)
      ? `FetchError ${error.status}: ${error.message}`
      : 'Upload failed'
  } finally {
    window.clearInterval(tick)
    busy.value = false
  }
}

const progressLabel = computed(() => `${Math.min(100, Math.round(progress.value))}%`)

const snippet = `await api.upload('/files', {
  file,
  fieldName: 'file',
  fields: { folder: 'avatars', public: true },
  onUploadProgress: ({ progress }) => setProgress(progress),
})`
</script>

<template>
  <section class="status-playground" aria-label="Live upload demo">
    <header class="status-playground-head">
      <div>
        <p class="status-playground-eyebrow">Live demo · Upload</p>
        <h2>api.upload + multipart fields</h2>
        <p class="status-playground-lead">
          Real <code>api.upload()</code> builds <code>FormData</code> and posts through
          <code>createFetch</code>. Add <code>onUploadProgress</code> in your app for XHR progress.
        </p>
      </div>
    </header>

    <div class="demo-upload-row">
      <input ref="fileInput" type="file" @change="onFileChange" />
      <label class="demo-field compact">
        <span>folder</span>
        <input v-model="folder" type="text" />
      </label>
      <button
        type="button"
        class="status-chip tone-ok"
        :disabled="busy || !selectedFile"
        @click="runUpload"
      >
        Upload
      </button>
    </div>

    <p class="status-result">{{ selectedName }}</p>

    <div class="demo-progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
      <div class="demo-progress-bar" :style="{ width: progressLabel }" />
      <span>{{ progressLabel }}</span>
    </div>

    <p class="status-result">{{ result }}</p>
    <pre class="status-code"><code>{{ snippet }}</code></pre>
  </section>
</template>
