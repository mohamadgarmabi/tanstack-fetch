<script setup lang="ts">
import { ref } from 'vue'

const TABS = [
  { id: 'status', label: 'HTTP status' },
  { id: 'ws', label: 'WebSocket' },
  { id: 'transport', label: 'WebTransport' },
  { id: 'stream', label: 'NDJSON' },
] as const

const active = ref<(typeof TABS)[number]['id']>('status')
</script>

<template>
  <section class="home-play">
    <div class="home-section-head">
      <p class="home-eyebrow">Playground</p>
      <h2>Click a status. Open a socket. It runs in the browser.</h2>
      <p class="home-lead">
        createFetch against mock servers: HTTP status handlers, WebSocket, WebTransport, and NDJSON
        streams. It is the same client, not a screenshot.
      </p>
    </div>
    <div class="home-install-managers home-play-tabs" role="tablist" aria-label="Playground demo">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        role="tab"
        class="home-install-manager"
        :class="{ 'is-active': tab.id === active }"
        :aria-selected="tab.id === active"
        @click="active = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <StatusPlayground v-if="active === 'status'" />
    <RealtimeDemo v-else :key="active" :kind="active" />
  </section>
</template>

<style scoped>
.home-play-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}
</style>
