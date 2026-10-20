<script setup lang="ts">
import { withBase } from 'vitepress'
import type { CompareMark, CompareRow } from './home.type'
import { compareRows } from './home.content'
import HomeIcon from './HomeIcon.vue'

type Library = keyof Omit<CompareRow, 'feature' | 'href'>

const libraries: { key: Library; label: string }[] = [
  { key: 'fetch', label: 'tanstack-fetch' },
  { key: 'axios', label: 'axios' },
  { key: 'ky', label: 'ky' },
  { key: 'ofetch', label: 'ofetch' },
]

const labelFor = (mark: CompareMark) => {
  if (mark === 'yes') return 'First-class'
  if (mark === 'partial') return 'Partial'
  return 'Not built in'
}

const iconFor = (mark: CompareMark) => {
  if (mark === 'yes') return 'check'
  if (mark === 'partial') return 'partial'
  return 'cross'
}

const scoreFor = (key: Library) => compareRows.filter((row) => row[key] === 'yes').length
</script>

<template>
  <section class="home-compare">
    <div class="home-section-head">
      <p class="home-eyebrow">Comparison</p>
      <h2>Measured against the usual clients.</h2>
      <p class="home-lead">
        axios, ky, and ofetch are all capable HTTP clients. tanstack-fetch is shaped for the
        TanStack Query call site, and for the SSR, SSE, and tRPC cases that sit next to it.
      </p>
    </div>

    <div class="cmp-card">
      <div class="cmp-scroll">
        <table class="cmp-table">
          <thead>
            <tr>
              <th scope="col" class="cmp-feature-col">Feature</th>
              <th
                v-for="lib in libraries"
                :key="lib.key"
                scope="col"
                :class="{ 'is-us': lib.key === 'fetch' }"
              >
                <span v-if="lib.key === 'fetch'" class="cmp-us">
                  <img :src="withBase('/images/logo.jpg')" alt="" width="22" height="22" />
                  <span class="cmp-us-name">{{ lib.label }}</span>
                </span>
                <template v-else>{{ lib.label }}</template>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in compareRows" :key="row.feature">
              <th scope="row">
                <a :href="withBase(row.href)">
                  {{ row.feature }}
                  <HomeIcon name="arrow" />
                </a>
              </th>
              <td v-for="lib in libraries" :key="lib.key" :class="{ 'is-us': lib.key === 'fetch' }">
                <span class="cmp-mark" :data-mark="row[lib.key]" :title="labelFor(row[lib.key])">
                  <HomeIcon :name="iconFor(row[lib.key])" />
                  <span class="cmp-sr">{{ labelFor(row[lib.key]) }}</span>
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Built in</th>
              <td v-for="lib in libraries" :key="lib.key" :class="{ 'is-us': lib.key === 'fetch' }">
                <span class="cmp-score">
                  <strong>{{ scoreFor(lib.key) }}</strong
                  >/{{ compareRows.length }}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="cmp-foot">
      <ul class="cmp-legend">
        <li>
          <span class="cmp-mark" data-mark="yes"><HomeIcon name="check" /></span>First-class
        </li>
        <li>
          <span class="cmp-mark" data-mark="partial"><HomeIcon name="partial" /></span>Possible,
          with extra adaptation
        </li>
        <li>
          <span class="cmp-mark" data-mark="no"><HomeIcon name="cross" /></span>Not built in
        </li>
      </ul>
      <a class="cmp-link" :href="withBase('/guide/comparison')">
        Full comparison
        <HomeIcon name="arrow" />
      </a>
    </div>
  </section>
</template>
