<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import {
  applyFrameworkFilter,
  FRAMEWORK_OPTIONS,
  framework,
  useDocsFramework,
} from '../composables/use-docs-framework'

useDocsFramework()

const route = useRoute()
const sectionCount = ref(0)
const visibleCount = ref(0)

const recountSections = () => {
  if (typeof document === 'undefined') return
  const sections = [...document.querySelectorAll<HTMLElement>('.fw-section[data-fw]')]
  sectionCount.value = sections.length
  applyFrameworkFilter(framework.value)
  visibleCount.value = sections.filter((section) => !section.hidden).length
}

const hint = computed(() => {
  if (framework.value === 'all') {
    return 'Show every framework section'
  }
  if (sectionCount.value === 0) {
    return 'Core docs stay visible — framework hubs filter in the sidebar'
  }
  return `Showing core + ${framework.value} (${visibleCount.value} sections)`
})

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const optionEls = ref<HTMLButtonElement[]>([])

const current = computed(
  () => FRAMEWORK_OPTIONS.find((item) => item.id === framework.value) ?? FRAMEWORK_OPTIONS[0],
)

const focusOption = (index: number) => {
  const count = FRAMEWORK_OPTIONS.length
  optionEls.value[(index + count) % count]?.focus()
}

const toggle = async () => {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  focusOption(FRAMEWORK_OPTIONS.findIndex((item) => item.id === framework.value))
}

const choose = (id: (typeof FRAMEWORK_OPTIONS)[number]['id']) => {
  framework.value = id
  open.value = false
  root.value?.querySelector<HTMLButtonElement>('.fw-picker-trigger')?.focus()
}

const onMenuKey = (event: KeyboardEvent) => {
  const index = optionEls.value.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'ArrowDown') focusOption(index + 1)
  else if (event.key === 'ArrowUp') focusOption(index - 1)
  else if (event.key === 'Home') focusOption(0)
  else if (event.key === 'End') focusOption(-1)
  else if (event.key === 'Escape' || event.key === 'Tab') {
    open.value = false
    if (event.key === 'Tab') return
    root.value?.querySelector<HTMLButtonElement>('.fw-picker-trigger')?.focus()
  } else return
  event.preventDefault()
}

const onDocumentClick = (event: MouseEvent) => {
  if (open.value && !root.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => {
  recountSections()
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

watch(
  () => route.path,
  () => {
    open.value = false
    requestAnimationFrame(() => recountSections())
  },
)

watch(framework, () => {
  requestAnimationFrame(() => recountSections())
})
</script>

<template>
  <div ref="root" class="fw-picker" :class="{ 'is-open': open }">
    <button
      type="button"
      class="fw-picker-trigger"
      :class="{ 'is-filtered': framework !== 'all' }"
      :title="hint"
      aria-haspopup="listbox"
      :aria-expanded="open"
      aria-label="Filter docs by framework"
      @click="toggle"
      @keydown.down.prevent="!open && toggle()"
    >
      <svg class="fw-picker-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2.5 3.5h11M4.5 8h7M6.5 12.5h3" />
      </svg>
      <span class="fw-picker-label">Framework</span>
      <span class="fw-picker-value">{{ current.label }}</span>
      <svg class="fw-picker-chevron" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4.5 6.5 8 10l3.5-3.5" />
      </svg>
    </button>

    <Transition name="fw-pop">
      <div
        v-if="open"
        class="fw-picker-menu"
        role="listbox"
        aria-label="Framework"
        @keydown="onMenuKey"
      >
        <p class="fw-picker-menu-hint">{{ hint }}</p>
        <button
          v-for="item in FRAMEWORK_OPTIONS"
          :key="item.id"
          ref="optionEls"
          type="button"
          role="option"
          class="fw-picker-option"
          :class="{ 'is-active': item.id === framework }"
          :aria-selected="item.id === framework"
          @click="choose(item.id)"
        >
          {{ item.label }}
          <svg v-if="item.id === framework" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3.5 8.5 6.5 11.5 12.5 5" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fw-picker {
  position: relative;
  display: inline-flex;
  margin-left: 0.5rem;
  min-width: 0;
  flex: 0 1 auto;
}

.fw-picker-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 34px;
  min-width: 0;
  padding: 0 0.6rem 0 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  color: var(--vp-c-text-1);
  font-size: 0.8rem;
  font-weight: 550;
  cursor: pointer;
  transition:
    border-color 0.3s var(--fx-ease),
    background-color 0.3s var(--fx-ease),
    transform 0.3s var(--fx-ease);
}

.fw-picker-trigger:hover,
.is-open .fw-picker-trigger {
  border-color: rgba(255, 122, 24, 0.35);
  background: rgba(255, 255, 255, 0.07);
}

.fw-picker-trigger:active {
  transform: scale(0.96);
}

.fw-picker-trigger:focus-visible {
  outline: 2px solid rgba(255, 122, 24, 0.6);
  outline-offset: 2px;
}

.fw-picker-trigger.is-filtered {
  border-color: rgba(255, 122, 24, 0.4);
  background: rgba(255, 122, 24, 0.1);
}

.fw-picker-trigger svg {
  flex: none;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fw-picker-icon {
  color: var(--vp-c-brand-1);
}

.fw-picker-label {
  color: var(--vp-c-text-3);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.fw-picker-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fw-picker-chevron {
  color: var(--vp-c-text-2);
  transition: transform 0.3s var(--fx-ease);
}

.is-open .fw-picker-chevron {
  transform: rotate(180deg);
}

.fw-picker-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  width: 19rem;
  max-height: min(70vh, 30rem);
  overflow-y: auto;
  padding: 0.4rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  /* Nested inside the nav's backdrop root, so blur can't see the page — stay opaque. */
  background: linear-gradient(180deg, #18181b, #111113);
  box-shadow:
    var(--fx-glass-edge),
    0 24px 60px rgba(0, 0, 0, 0.55);
  white-space: normal;
}

.fw-picker-menu-hint {
  grid-column: 1 / -1;
  margin: 0.2rem 0.55rem 0.4rem;
  color: var(--vp-c-text-3);
  font-size: 0.72rem;
  line-height: 1.4;
}

.fw-picker-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.65rem;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.84rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s var(--fx-ease),
    background-color 0.2s var(--fx-ease);
}

.fw-picker-option:hover,
.fw-picker-option:focus-visible {
  outline: none;
  color: var(--vp-c-text-1);
  background: rgba(255, 255, 255, 0.06);
}

.fw-picker-option.is-active {
  color: var(--vp-c-brand-1);
  background: rgba(255, 122, 24, 0.1);
}

.fw-picker-option svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fw-pop-enter-active,
.fw-pop-leave-active {
  transition:
    opacity 0.25s var(--fx-ease),
    transform 0.25s var(--fx-ease);
  transform-origin: top right;
}

.fw-pop-enter-from,
.fw-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.96);
}

@media (max-width: 1279px) {
  .fw-picker-label {
    display: none;
  }
}

@media (max-width: 768px) {
  .fw-picker {
    margin-left: 0.25rem;
  }

  .fw-picker-trigger {
    max-width: 7.5rem;
    height: 32px;
    padding: 0 0.5rem;
  }

  .fw-picker-icon {
    display: none;
  }

  .fw-picker-menu {
    right: -2.75rem;
    width: min(19rem, calc(100vw - 2rem));
  }
}

@media (prefers-reduced-motion: reduce) {
  .fw-picker-trigger,
  .fw-picker-chevron,
  .fw-pop-enter-active,
  .fw-pop-leave-active {
    transition: none;
  }
}
</style>
