<script setup lang="ts">
import { computed, ref } from 'vue'

type InstallKind = 'package' | 'skills'

const props = withDefaults(
  defineProps<{
    /** Space-separated package names for `package` kind. */
    packages?: string
    /** `package` = npm/pnpm/yarn/bun add · `skills` = npx/dlx/bunx skills add */
    kind?: InstallKind
    /** Args after `skills add` when kind is `skills`. */
    skill?: string
    /** Append `-g` for global skill install. */
    global?: boolean
  }>(),
  {
    packages: 'tanstack-fetch',
    kind: 'package',
    skill: 'mohamadgarmabi/tanstack-fetch --skill tanstack-fetch',
    global: false,
  },
)

type ManagerOption = {
  id: string
  label: string
  command: string
}

const options = computed((): ManagerOption[] => {
  if (props.kind === 'skills') {
    const args = `${props.skill}${props.global ? ' -g' : ''}`
    return [
      { id: 'npm', label: 'npm', command: `npx skills add ${args}` },
      { id: 'pnpm', label: 'pnpm', command: `pnpm dlx skills add ${args}` },
      { id: 'yarn', label: 'yarn', command: `yarn dlx skills add ${args}` },
      { id: 'bun', label: 'bun', command: `bunx skills add ${args}` },
    ]
  }

  const pkgs = props.packages.trim()
  return [
    { id: 'npm', label: 'npm', command: `npm install ${pkgs}` },
    { id: 'pnpm', label: 'pnpm', command: `pnpm add ${pkgs}` },
    { id: 'yarn', label: 'yarn', command: `yarn add ${pkgs}` },
    { id: 'bun', label: 'bun', command: `bun add ${pkgs}` },
  ]
})

const activeId = ref('npm')
const copied = ref(false)

const active = computed(
  () => options.value.find((item) => item.id === activeId.value) ?? options.value[0],
)

const select = (id: string) => {
  activeId.value = id
  copied.value = false
}

const copy = async () => {
  await navigator.clipboard.writeText(active.value.command)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <div class="install-tabs" role="group" :aria-label="`${props.kind} install commands`">
    <div class="install-tabs-bar" role="tablist">
      <button
        v-for="item in options"
        :key="item.id"
        type="button"
        role="tab"
        class="install-tabs-tab"
        :class="{ 'is-active': item.id === active.id }"
        :aria-selected="item.id === active.id"
        @click="select(item.id)"
      >
        {{ item.label }}
      </button>
    </div>
    <button class="install-tabs-cmd" type="button" @click="copy">
      <span class="install-tabs-prompt">$</span>
      <code>{{ active.command }}</code>
      <span class="install-tabs-copy">{{ copied ? 'Copied' : 'Copy' }}</span>
    </button>
  </div>
</template>
