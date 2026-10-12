<script setup lang="ts">
type LampEffectProps = {
  className?: string
}

withDefaults(defineProps<LampEffectProps>(), {
  className: '',
})
</script>

<template>
  <div class="lamp-effect" :class="className">
    <div class="lamp-effect-stage" aria-hidden="true">
      <div class="lamp-ambient" />
      <div class="lamp-grid" />

      <div class="lamp-beam lamp-beam-left">
        <span class="lamp-beam-fade lamp-beam-fade-x" />
        <span class="lamp-beam-fade lamp-beam-fade-y" />
      </div>
      <div class="lamp-beam lamp-beam-right">
        <span class="lamp-beam-fade lamp-beam-fade-x" />
        <span class="lamp-beam-fade lamp-beam-fade-y" />
      </div>

      <div class="lamp-orb" />
      <div class="lamp-flare" />
      <div class="lamp-line">
        <span class="lamp-line-core" />
        <span class="lamp-line-glow" />
        <span class="lamp-line-sheen" />
      </div>
      <div class="lamp-wash" />
    </div>

    <div class="lamp-effect-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lamp-effect {
  --lamp-bg: transparent;
  --lamp-accent: #ff7a18;
  --lamp-accent-soft: #ffb06a;
  --lamp-accent-hot: #ffe2c0;
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: min(78vh, 44rem);
  overflow: hidden;
  isolation: isolate;
}

.lamp-effect-stage {
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: 20rem;
  pointer-events: none;
}

.lamp-ambient {
  position: absolute;
  inset: -10% 10% auto;
  height: 18rem;
  background:
    radial-gradient(ellipse 55% 70% at 50% 0%, rgba(255, 122, 24, 0.28), transparent 68%),
    radial-gradient(ellipse 30% 40% at 50% 18%, rgba(255, 176, 106, 0.18), transparent 70%);
  animation: ambient-breathe 7s ease-in-out infinite;
}

.lamp-grid {
  position: absolute;
  inset: 0;
  opacity: 0.28;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(ellipse 65% 50% at 50% 8%, black 10%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse 65% 50% at 50% 8%, black 10%, transparent 72%);
  animation: grid-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lamp-beam {
  position: absolute;
  top: 0;
  height: 13.5rem;
  width: 12rem;
  opacity: 0;
  animation: beam-open 1.15s cubic-bezier(0.22, 1, 0.36, 1) 0.12s forwards;
}

.lamp-beam-left {
  right: 50%;
  background: conic-gradient(
    from 70deg at 100% 0%,
    rgba(255, 240, 220, 1) 0deg,
    rgba(255, 176, 106, 0.85) 12deg,
    rgba(255, 122, 24, 0.45) 28deg,
    rgba(255, 122, 24, 0.12) 42deg,
    transparent 58deg
  );
  filter: blur(0.4px);
}

.lamp-beam-right {
  left: 50%;
  background: conic-gradient(
    from 290deg at 0% 0%,
    transparent 0deg,
    transparent 302deg,
    rgba(255, 122, 24, 0.12) 318deg,
    rgba(255, 122, 24, 0.45) 332deg,
    rgba(255, 176, 106, 0.85) 348deg,
    rgba(255, 240, 220, 1) 360deg
  );
  filter: blur(0.4px);
}

.lamp-beam-fade {
  position: absolute;
  background: linear-gradient(180deg, transparent, #09090b);
}

.lamp-beam-fade-y {
  inset: auto 0 0;
  height: 55%;
  background: linear-gradient(180deg, transparent, #09090b 88%);
  mask-image: linear-gradient(to top, black, transparent);
  -webkit-mask-image: linear-gradient(to top, black, transparent);
}

.lamp-beam-left .lamp-beam-fade-x {
  inset: 0 auto 0 0;
  width: 55%;
  background: #09090b;
  mask-image: linear-gradient(to right, black, transparent);
  -webkit-mask-image: linear-gradient(to right, black, transparent);
}

.lamp-beam-right .lamp-beam-fade-x {
  inset: 0 0 0 auto;
  width: 55%;
  background: #09090b;
  mask-image: linear-gradient(to left, black, transparent);
  -webkit-mask-image: linear-gradient(to left, black, transparent);
}

.lamp-orb {
  position: absolute;
  top: 3.6rem;
  left: 50%;
  width: min(28rem, 70vw);
  height: 8rem;
  border-radius: 999px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 176, 106, 0.45),
    rgba(255, 122, 24, 0.2) 42%,
    transparent 72%
  );
  transform: translateX(-50%);
  filter: blur(26px);
  animation:
    orb-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both,
    orb-breathe 6.5s ease-in-out 1.3s infinite;
}

.lamp-flare {
  position: absolute;
  top: 0.4rem;
  left: 50%;
  width: 5.5rem;
  height: 7rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 50% 20%,
    rgba(255, 248, 235, 0.95),
    rgba(255, 176, 106, 0.55) 38%,
    rgba(255, 122, 24, 0.12) 62%,
    transparent 78%
  );
  transform: translateX(-50%);
  filter: blur(18px);
  animation: flare-in 1s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
}

.lamp-line {
  position: absolute;
  top: 5.85rem;
  left: 50%;
  z-index: 2;
  width: 0;
  height: 2px;
  transform: translateX(-50%);
  animation: line-open 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
}

.lamp-line-core {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--lamp-accent-hot) 18%,
    #fff 50%,
    var(--lamp-accent-hot) 82%,
    transparent 100%
  );
  box-shadow:
    0 0 8px rgba(255, 226, 192, 0.95),
    0 0 22px rgba(255, 122, 24, 0.9),
    0 0 48px rgba(255, 90, 31, 0.45);
}

.lamp-line-glow {
  position: absolute;
  inset: -10px 8%;
  border-radius: 999px;
  background: rgba(255, 122, 24, 0.35);
  filter: blur(12px);
}

.lamp-line-sheen {
  position: absolute;
  top: -1px;
  left: 0;
  width: 28%;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
  filter: blur(1px);
  animation: sheen-run 3.8s ease-in-out 1.4s infinite;
}

.lamp-wash {
  position: absolute;
  top: 5.9rem;
  left: 50%;
  width: min(42rem, 92vw);
  height: 16rem;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse 70% 55% at 50% 0%,
    rgba(255, 122, 24, 0.16),
    rgba(255, 122, 24, 0.05) 42%,
    transparent 72%
  );
  animation: wash-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;
}

.lamp-effect-content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 44rem;
  margin-top: 8.75rem;
  padding: 0 1.25rem 2.75rem;
  text-align: center;
}

.lamp-effect-content :deep(.home-badge),
.lamp-effect-content :deep(h1),
.lamp-effect-content :deep(.home-hero-lead),
.lamp-effect-content :deep(.home-actions),
.lamp-effect-content :deep(.home-install-wrap) {
  animation: content-rise 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lamp-effect-content :deep(.home-badge) {
  animation-delay: 0.35s;
}

.lamp-effect-content :deep(h1) {
  animation-delay: 0.48s;
}

.lamp-effect-content :deep(.home-hero-lead) {
  animation-delay: 0.6s;
}

.lamp-effect-content :deep(.home-actions) {
  animation-delay: 0.72s;
}

.lamp-effect-content :deep(.home-install-wrap) {
  animation-delay: 0.84s;
}

@keyframes beam-open {
  from {
    opacity: 0;
    width: 8rem;
  }
  to {
    opacity: 1;
    width: min(28rem, 46vw);
  }
}

@keyframes line-open {
  from {
    width: 0;
    opacity: 0.2;
  }
  to {
    width: min(30rem, 72vw);
    opacity: 1;
  }
}

@keyframes flare-in {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.7);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

@keyframes orb-in {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

@keyframes orb-breathe {
  0%,
  100% {
    opacity: 0.85;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.05);
  }
}

@keyframes ambient-breathe {
  0%,
  100% {
    opacity: 0.85;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.03);
  }
}

@keyframes wash-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes grid-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.28;
  }
}

@keyframes sheen-run {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
  }
  50% {
    transform: translateX(250%);
    opacity: 0.35;
  }
  85%,
  100% {
    transform: translateX(280%);
    opacity: 0;
  }
}

@keyframes content-rise {
  from {
    opacity: 0;
    transform: translateY(1.1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .lamp-effect {
    min-height: min(72vh, 40rem);
  }

  .lamp-effect-stage {
    height: 15rem;
  }

  .lamp-line {
    top: 4.6rem;
  }

  .lamp-orb {
    top: 2.6rem;
  }

  .lamp-flare {
    top: 0.15rem;
    width: 4.25rem;
  }

  .lamp-wash {
    top: 4.65rem;
  }

  .lamp-effect-content {
    margin-top: 7rem;
    padding-bottom: 2rem;
  }

  @keyframes beam-open {
    from {
      opacity: 0;
      width: 6rem;
    }
    to {
      opacity: 1;
      width: min(18rem, 58vw);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .lamp-ambient,
  .lamp-grid,
  .lamp-beam,
  .lamp-orb,
  .lamp-flare,
  .lamp-line,
  .lamp-line-sheen,
  .lamp-wash,
  .lamp-effect-content :deep(.home-badge),
  .lamp-effect-content :deep(h1),
  .lamp-effect-content :deep(.home-hero-lead),
  .lamp-effect-content :deep(.home-actions),
  .lamp-effect-content :deep(.home-install-wrap) {
    animation: none !important;
  }

  .lamp-beam {
    opacity: 1;
    width: min(28rem, 46vw);
  }

  .lamp-line {
    width: min(30rem, 72vw);
    opacity: 1;
  }

  .lamp-orb,
  .lamp-flare,
  .lamp-wash,
  .lamp-ambient {
    opacity: 1;
  }
}
</style>
