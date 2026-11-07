<script setup lang="ts">
import './blocks.css'

// Chip centers for the interceptor pipeline; each lights up when the request dot reaches it.
const PIPE = ['auth', 'trace', 'retry', 'status', 'fetch']
const PIPE_DUR = 4
// The dot crosses x=8..352 during the first 45% of the cycle; highlights peak at 46%.
const pipeDelay = (index: number) => {
  const center = 12 + index * 70 + 29
  const arrival = ((center - 8) / 344) * 0.45
  return `${((arrival - 0.46) * PIPE_DUR).toFixed(2)}s`
}

const FRAMEWORKS = [
  { name: 'React', x: 20, y: 22 },
  { name: 'Vue', x: 260, y: 22 },
  { name: 'Solid', x: 12, y: 132 },
  { name: 'Svelte', x: 268, y: 132 },
  { name: 'Angular', x: 140, y: 162 },
]
const chipCenter = (chip: { x: number; y: number }) => ({ x: chip.x + 40, y: chip.y + 14 })

const MESSAGES = ["{ status: 'paid' }", "{ text: 'hi' }", '{ progress: 64 }']
</script>

<template>
  <section class="home-blocks">
    <div class="home-section-head">
      <p class="home-eyebrow">Building blocks</p>
      <h2>Everything around the request.</h2>
      <p class="home-lead">
        One client, small pieces you add when you need them. Each one keeps the
        <code>queryFn</code> contract: data back, typed error thrown, signal honored.
      </p>
    </div>

    <ul class="blk-grid">
      <!-- 1. Typed errors -->
      <li class="blk fx-spotlight" style="--c: #f87171">
        <div class="blk-stage">
          <svg
            viewBox="0 0 360 200"
            role="img"
            aria-label="A request resolves to data or throws a FetchError"
          >
            <rect class="blk-box" x="110" y="22" width="140" height="32" rx="7" />
            <text class="blk-code" x="180" y="42" text-anchor="middle">api.get('/me')</text>

            <path class="blk-line" d="M180 54 C180 95 100 92 100 130" />
            <path class="blk-line" d="M180 54 C180 95 260 92 260 130" />
            <path
              class="blk-comet"
              pathLength="100"
              d="M180 54 C180 95 100 92 100 130"
              style="--dur: 4s"
            />
            <path
              class="blk-comet"
              pathLength="100"
              d="M180 54 C180 95 260 92 260 130"
              style="--dur: 4s; --delay: 2s"
            />

            <rect
              class="blk-box blk-hit"
              x="40"
              y="130"
              width="120"
              height="40"
              rx="7"
              style="--dur: 4s; --hit: #4ade80"
            />
            <text class="blk-label" x="100" y="147" text-anchor="middle">200 · data</text>
            <text class="blk-code blk-dim" x="100" y="162" text-anchor="middle">{ id: 1 }</text>

            <rect
              class="blk-box blk-hit"
              x="200"
              y="130"
              width="120"
              height="40"
              rx="7"
              style="--dur: 4s; --delay: 2s"
            />
            <text class="blk-label" x="260" y="147" text-anchor="middle">FetchError</text>
            <text class="blk-code blk-dim" x="260" y="162" text-anchor="middle">status 401</text>
          </svg>
        </div>
        <h3><span class="blk-dot" />Typed errors</h3>
        <p>Data on success. A <code>FetchError</code> with status and body on failure.</p>
      </li>

      <!-- 2. One refresh -->
      <li class="blk fx-spotlight" style="--c: #60a5fa">
        <div class="blk-stage">
          <svg
            viewBox="0 0 360 200"
            role="img"
            aria-label="Three parallel 401 responses share one token refresh"
          >
            <g v-for="(path, index) in ['/a', '/b', '/c']" :key="path">
              <path
                class="blk-line"
                :d="`M128 ${54 + index * 46} C170 ${54 + index * 46} 170 100 204 100`"
              />
              <path
                class="blk-comet"
                pathLength="100"
                :d="`M128 ${54 + index * 46} C170 ${54 + index * 46} 170 100 204 100`"
                style="--dur: 5s"
              />
              <rect class="blk-box" x="18" :y="40 + index * 46" width="110" height="28" rx="7" />
              <text class="blk-code" x="30" :y="58 + index * 46">GET {{ path }}</text>
              <text
                class="blk-code blk-bad blk-swap-out"
                x="116"
                :y="58 + index * 46"
                text-anchor="end"
              >
                401
              </text>
              <text
                class="blk-code blk-good blk-swap-in"
                x="116"
                :y="58 + index * 46"
                text-anchor="end"
              >
                200
              </text>
            </g>
            <circle class="blk-ring" cx="244" cy="100" r="40" />
            <circle class="blk-box blk-node" cx="244" cy="100" r="40" />
            <text class="blk-label" x="244" y="98" text-anchor="middle">refresh()</text>
            <text class="blk-code blk-dim" x="244" y="114" text-anchor="middle">1 call</text>
          </svg>
        </div>
        <h3><span class="blk-dot" />One refresh</h3>
        <p>Parallel 401s share one refresh, then retry with the new token.</p>
      </li>

      <!-- 3. Interceptors -->
      <li class="blk fx-spotlight" style="--c: #facc15">
        <div class="blk-stage">
          <svg
            viewBox="0 0 360 200"
            role="img"
            aria-label="A request passes through ordered interceptors"
          >
            <text class="blk-code blk-dim" x="12" y="62">request →</text>
            <text class="blk-code blk-dim" x="348" y="160" text-anchor="end">← response</text>
            <path class="blk-line" d="M8 99 L352 99" />
            <path class="blk-line" d="M352 140 L8 140" />
            <path
              class="blk-comet"
              pathLength="100"
              d="M8 99 L352 99"
              :style="`--dur: ${PIPE_DUR}s`"
            />
            <path
              class="blk-comet"
              pathLength="100"
              d="M352 140 L8 140"
              :style="`--dur: ${PIPE_DUR}s; --delay: 2s`"
            />
            <g v-for="(name, index) in PIPE" :key="name">
              <rect
                class="blk-box blk-hit"
                :x="12 + index * 70"
                y="84"
                width="58"
                height="30"
                rx="7"
                :style="`--dur: ${PIPE_DUR}s; --delay: ${pipeDelay(index)}`"
              />
              <text class="blk-code" :x="41 + index * 70" y="103" text-anchor="middle">
                {{ name }}
              </text>
            </g>
          </svg>
        </div>
        <h3><span class="blk-dot" />Interceptors</h3>
        <p>Auth, tracing, retries and status handlers as small, ordered steps.</p>
      </li>

      <!-- 4. Live data -->
      <li class="blk blk-wide fx-spotlight" style="--c: #4ade80">
        <div class="blk-stage">
          <svg viewBox="0 0 360 200" role="img" aria-label="A server streams events to the client">
            <rect class="blk-box" x="14" y="72" width="92" height="56" rx="9" />
            <text class="blk-label" x="60" y="96" text-anchor="middle">server</text>
            <text class="blk-code blk-dim" x="60" y="113" text-anchor="middle">SSE · WS</text>
            <path class="blk-line" d="M106 100 L150 100" />
            <path
              class="blk-comet blk-fast"
              pathLength="100"
              d="M106 100 L150 100"
              style="--dur: 1.5s"
            />
            <g
              v-for="(message, index) in MESSAGES"
              :key="message"
              class="blk-msg"
              :style="`--delay: ${index * 1.5}s`"
            >
              <rect class="blk-box" x="156" :y="44 + index * 40" width="190" height="30" rx="7" />
              <circle class="blk-pip" cx="172" :cy="59 + index * 40" r="3.5" />
              <text class="blk-code" x="184" :y="63 + index * 40">{{ message }}</text>
            </g>
          </svg>
        </div>
        <h3><span class="blk-dot" />Live data</h3>
        <p>SSE, WebSocket and NDJSON streams with the same auth, params and interceptors.</p>
      </li>

      <!-- 5. Every framework -->
      <li class="blk blk-wide fx-spotlight" style="--c: #c084fc">
        <div class="blk-stage">
          <svg
            viewBox="0 0 360 200"
            role="img"
            aria-label="One api client shared by React, Vue, Solid, Svelte and Angular"
          >
            <g v-for="(chip, index) in FRAMEWORKS" :key="chip.name">
              <path class="blk-line" :d="`M180 96 L${chipCenter(chip).x} ${chipCenter(chip).y}`" />
              <path
                class="blk-comet"
                pathLength="100"
                :d="`M180 96 L${chipCenter(chip).x} ${chipCenter(chip).y}`"
                :style="`--dur: 5s; --delay: ${index}s`"
              />
              <rect
                class="blk-box blk-hit"
                :x="chip.x"
                :y="chip.y"
                width="80"
                height="28"
                rx="7"
                :style="`--dur: 5s; --delay: ${index}s`"
              />
              <text class="blk-code" :x="chip.x + 40" :y="chip.y + 18" text-anchor="middle">
                {{ chip.name }}
              </text>
            </g>
            <circle class="blk-ring" cx="180" cy="96" r="28" style="--dur: 2.5s" />
            <circle class="blk-box blk-node" cx="180" cy="96" r="28" />
            <text class="blk-label" x="180" y="100" text-anchor="middle">api</text>
          </svg>
        </div>
        <h3><span class="blk-dot" />Every framework</h3>
        <p>One client for React, Vue, Solid, Angular and Svelte, plus tRPC and SSR.</p>
      </li>
    </ul>
  </section>
</template>
