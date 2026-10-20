<script setup lang="ts">
import { withBase } from 'vitepress'
import { highlightTypeScript } from './home-highlight'
import { quickstartCode } from './home.content'
import HomeIcon from './HomeIcon.vue'

const highlighted = highlightTypeScript(quickstartCode)
</script>

<template>
  <section class="home-quick">
    <div class="home-section-head">
      <p class="home-eyebrow">30-second start</p>
      <h2>Three lines into Query.</h2>
      <p class="home-lead">
        Install the package, create a client, pass signal. That is the whole setup.
      </p>
    </div>

    <div class="home-quick-grid">
      <div class="home-code">
        <div class="home-code-bar">
          <span class="home-code-dots" aria-hidden="true" />
          <span>app.ts</span>
        </div>
        <pre><code v-html="highlighted" /></pre>
      </div>

      <div class="home-quick-side">
        <p class="home-quick-kicker">What the queryFn gets</p>
        <ol>
          <li>
            <span class="home-quick-step">1</span>
            <div>
              <strong>Data on success</strong><small>Parsed JSON, typed by your generic.</small>
            </div>
            <HomeIcon name="check" />
          </li>
          <li>
            <span class="home-quick-step">2</span>
            <div>
              <strong><code>FetchError</code> on failure</strong>
              <small>status, code, and body — Query's error state.</small>
            </div>
            <HomeIcon name="check" />
          </li>
          <li>
            <span class="home-quick-step">3</span>
            <div>
              <strong><code>AbortSignal</code> honored</strong>
              <small>Unmounts and refetches cancel in flight.</small>
            </div>
            <HomeIcon name="check" />
          </li>
        </ol>
        <a class="home-btn home-btn-primary" :href="withBase('/guide/getting-started')">
          Get started
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
        </a>
      </div>
    </div>
  </section>
</template>
