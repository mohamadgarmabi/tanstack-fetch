<script setup lang="ts">
import { computed } from 'vue'

type LampEffectProps = {
  delay?: number
  duration?: number
  className?: string
}

const props = withDefaults(defineProps<LampEffectProps>(), {
  delay: 0.35,
  duration: 1.05,
  className: '',
})

const durationInSeconds = computed(() => `${props.duration}s`)
const delayInSeconds = computed(() => `${props.delay}s`)
</script>

<template>
  <div class="lamp-effect" :class="className">
    <div class="lamp-effect-stage" aria-hidden="true">
      <div class="lamp-haze" />
      <div class="lamp-grid" />

      <div class="lamp-cone lamp-cone-left animate-conic-gradient">
        <div class="lamp-mask lamp-mask-bottom" />
        <div class="lamp-mask lamp-mask-side lamp-mask-right" />
      </div>

      <div class="lamp-cone lamp-cone-right animate-conic-gradient">
        <div class="lamp-mask lamp-mask-bottom" />
        <div class="lamp-mask lamp-mask-side lamp-mask-left" />
      </div>

      <div class="lamp-glow animate-glow-pulse" />
      <div class="lamp-spotlight animate-spotlight" />
      <div class="lamp-line animate-glowing-line">
        <span class="lamp-line-core" />
        <span class="lamp-line-bloom" />
      </div>
      <div class="lamp-falloff" />
    </div>

    <div class="lamp-effect-content animate-content-rise">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lamp-effect {
  --lamp-bg: #09090b;
  --lamp-accent: #ff7a18;
  --lamp-accent-soft: #ffb06a;
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: min(92vh, 54rem);
  overflow: hidden;
  border-radius: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(ellipse 55% 35% at 50% 18%, rgba(255, 122, 24, 0.18), transparent 70%),
    linear-gradient(180deg, #0c0c10 0%, var(--lamp-bg) 48%, #070709 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 24px 80px rgba(0, 0, 0, 0.45);
}

.lamp-effect-stage {
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: 26rem;
  pointer-events: none;
  isolation: isolate;
}

.lamp-haze {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 122, 24, 0.22), transparent 42%),
    radial-gradient(circle at 50% 35%, rgba(255, 90, 31, 0.12), transparent 55%);
}

.lamp-grid {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 55% at 50% 20%, black, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 55% at 50% 20%, black, transparent 75%);
}

.lamp-cone {
  position: absolute;
  top: 0.5rem;
  height: 15rem;
  width: 15rem;
  opacity: 0.5;
}

.lamp-cone-left {
  right: 50%;
  background-image: conic-gradient(
    from 70deg at center top,
    rgba(255, 176, 106, 0.95),
    rgba(255, 122, 24, 0.35),
    transparent 42%,
    transparent
  );
}

.lamp-cone-right {
  left: 50%;
  background-image: conic-gradient(
    from 290deg at center top,
    transparent,
    transparent 58%,
    rgba(255, 122, 24, 0.35),
    rgba(255, 176, 106, 0.95)
  );
}

.lamp-mask {
  position: absolute;
  z-index: 2;
  background: var(--lamp-bg);
}

.lamp-mask-bottom {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 9rem;
  mask-image: linear-gradient(to top, white, transparent);
  -webkit-mask-image: linear-gradient(to top, white, transparent);
}

.lamp-cone-right .lamp-mask-bottom {
  left: auto;
  right: 0;
}

.lamp-mask-side {
  bottom: 0;
  width: 9rem;
  height: 100%;
}

.lamp-mask-right {
  left: 0;
  mask-image: linear-gradient(to right, white, transparent);
  -webkit-mask-image: linear-gradient(to right, white, transparent);
}

.lamp-mask-left {
  right: 0;
  mask-image: linear-gradient(to left, white, transparent);
  -webkit-mask-image: linear-gradient(to left, white, transparent);
}

.lamp-glow {
  position: absolute;
  top: 5.2rem;
  left: 50%;
  z-index: 3;
  width: min(34rem, 85vw);
  height: 10rem;
  border-radius: 999px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 176, 106, 0.55),
    rgba(255, 122, 24, 0.28) 45%,
    transparent 72%
  );
  transform: translateX(-50%);
  filter: blur(28px);
}

.lamp-spotlight {
  position: absolute;
  top: 1.8rem;
  left: 50%;
  z-index: 4;
  width: 8rem;
  height: 10rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 50% 30%,
    rgba(255, 230, 190, 0.9),
    rgba(255, 122, 24, 0.55) 40%,
    transparent 70%
  );
  transform: translateX(-50%);
  filter: blur(26px);
}

.lamp-line {
  position: absolute;
  top: 7.1rem;
  left: 50%;
  z-index: 6;
  width: 15rem;
  height: 2px;
  transform: translateX(-50%);
}

.lamp-line-core {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent,
    #fff6e8 18%,
    #ffe0b5 50%,
    #fff6e8 82%,
    transparent
  );
  box-shadow:
    0 0 10px rgba(255, 214, 160, 0.9),
    0 0 28px rgba(255, 122, 24, 0.85),
    0 0 60px rgba(255, 90, 31, 0.45);
}

.lamp-line-bloom {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 42%;
  height: 18px;
  border-radius: 999px;
  background: rgba(255, 176, 106, 0.45);
  transform: translate(-50%, -50%);
  filter: blur(10px);
}

.lamp-falloff {
  position: absolute;
  top: 7.2rem;
  left: 0;
  z-index: 5;
  width: 100%;
  height: 16rem;
  background: linear-gradient(
    180deg,
    rgba(9, 9, 11, 0) 0%,
    rgba(9, 9, 11, 0.55) 28%,
    rgba(9, 9, 11, 0.92) 62%,
    var(--lamp-bg) 100%
  );
}

.lamp-effect-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 46rem;
  margin-top: 10.5rem;
  padding: 0 1.35rem 3.5rem;
  text-align: center;
}

.animate-spotlight {
  animation: spotlight-anim cubic-bezier(0.22, 1, 0.36, 1) v-bind(durationInSeconds) forwards;
  animation-delay: v-bind(delayInSeconds);
}

.animate-glowing-line {
  animation: glowing-line-anim cubic-bezier(0.22, 1, 0.36, 1) v-bind(durationInSeconds) forwards;
  animation-delay: v-bind(delayInSeconds);
}

.animate-conic-gradient {
  animation: conic-gradient-anim cubic-bezier(0.22, 1, 0.36, 1) v-bind(durationInSeconds) forwards;
  animation-delay: v-bind(delayInSeconds);
}

.animate-glow-pulse {
  animation: glow-pulse 4.5s ease-in-out 1.4s infinite;
}

.animate-content-rise {
  animation: content-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(v-bind(delayInSeconds) + 0.15s);
}

@keyframes spotlight-anim {
  from {
    width: 7rem;
    opacity: 0.35;
  }
  to {
    width: 17rem;
    opacity: 1;
  }
}

@keyframes glowing-line-anim {
  from {
    width: 12rem;
    opacity: 0.4;
  }
  to {
    width: min(32rem, 78vw);
    opacity: 1;
  }
}

@keyframes conic-gradient-anim {
  from {
    opacity: 0.35;
    width: 14rem;
  }
  to {
    opacity: 1;
    width: 32rem;
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.78;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.04);
  }
}

@keyframes content-rise {
  from {
    opacity: 0;
    transform: translateY(1.25rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .lamp-effect {
    min-height: min(84vh, 46rem);
    border-radius: 1rem;
  }

  .lamp-effect-stage {
    height: 18rem;
  }

  .lamp-line {
    top: 5.7rem;
  }

  .lamp-falloff {
    top: 5.8rem;
  }

  .lamp-glow {
    top: 4rem;
    width: min(22rem, 90vw);
  }

  .lamp-spotlight {
    top: 1.1rem;
  }

  .lamp-effect-content {
    margin-top: 8.25rem;
    padding-bottom: 2.4rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-spotlight,
  .animate-glowing-line,
  .animate-conic-gradient,
  .animate-glow-pulse,
  .animate-content-rise {
    animation: none;
  }

  .lamp-spotlight {
    width: 17rem;
    opacity: 1;
  }

  .lamp-line {
    width: min(32rem, 78vw);
    opacity: 1;
  }

  .lamp-cone {
    opacity: 1;
    width: 32rem;
  }

  .lamp-effect-content {
    opacity: 1;
    transform: none;
  }
}
</style>
