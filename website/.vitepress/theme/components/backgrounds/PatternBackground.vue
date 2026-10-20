<script setup lang="ts">
/**
 * Moving grid / dot pattern, ported from Inspira UI's PatternBackground
 * (https://inspira-ui.com/docs/en/components/backgrounds/pattern-background)
 * without the Tailwind dependency.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'grid' | 'dot' | 'big-dot'
    /** Cell size in px. */
    size?: number
    color?: string
    animate?: boolean
    direction?: 'top' | 'bottom' | 'left' | 'right'
    /** Duration of one cycle in ms. */
    speed?: number
    mask?: 'ellipse' | 'ellipse-top' | 'none'
  }>(),
  {
    variant: 'grid',
    size: 24,
    color: 'rgba(255, 255, 255, 0.06)',
    animate: false,
    direction: 'top',
    speed: 10000,
    mask: 'none',
  },
)

const style = computed(() => {
  const { variant, size, color } = props
  const image =
    variant === 'grid'
      ? `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`
      : `radial-gradient(${color} ${variant === 'big-dot' ? 3 : 1}px, transparent ${variant === 'big-dot' ? 3 : 1}px)`
  return {
    '--pb-size': `${size}px`,
    '--pb-speed': `${props.speed}ms`,
    backgroundImage: image,
  }
})
</script>

<template>
  <div
    class="pattern-background"
    :class="[animate && `is-moving move-${direction}`, mask !== 'none' && `mask-${mask}`]"
    :style="style"
    aria-hidden="true"
  >
    <slot />
  </div>
</template>

<style scoped>
.pattern-background {
  position: relative;
  background-size: var(--pb-size) var(--pb-size);
  pointer-events: none;
}

.mask-ellipse {
  mask-image: radial-gradient(ellipse at center, #000 20%, transparent 75%);
}

.mask-ellipse-top {
  mask-image: radial-gradient(ellipse 80% 70% at top, #000 20%, transparent 80%);
}

.is-moving {
  animation: var(--pb-speed) linear infinite;
}

/* Shift exactly one cell per cycle so the loop is seamless. */
.move-top {
  animation-name: pb-to-top;
}
.move-bottom {
  animation-name: pb-to-bottom;
}
.move-left {
  animation-name: pb-to-left;
}
.move-right {
  animation-name: pb-to-right;
}

@keyframes pb-to-top {
  to {
    background-position: 0 calc(-1 * var(--pb-size));
  }
}
@keyframes pb-to-bottom {
  to {
    background-position: 0 var(--pb-size);
  }
}
@keyframes pb-to-left {
  to {
    background-position: calc(-1 * var(--pb-size)) 0;
  }
}
@keyframes pb-to-right {
  to {
    background-position: var(--pb-size) 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-moving {
    animation: none;
  }
}
</style>
