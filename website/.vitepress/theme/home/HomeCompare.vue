<script setup lang="ts">
import { withBase } from 'vitepress'
import type { CompareMark } from './home.type'
import { compareRows } from './home.content'

const labelFor = (mark: CompareMark) => {
  if (mark === 'yes') return 'First-class'
  if (mark === 'partial') return 'Partial'
  return 'Not built in'
}
</script>

<template>
  <section class="home-compare">
    <div class="home-section-head">
      <p class="home-eyebrow">Comparison</p>
      <h2>Measured against the usual clients.</h2>
      <p class="home-lead">
        axios, ky, and ofetch are all capable HTTP clients. tanstack-fetch is shaped for the TanStack
        Query call site, and for the SSR, SSE, and tRPC cases that sit next to it.
        <a :href="withBase('/guide/comparison')">Full comparison</a>
      </p>
    </div>

    <div class="home-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>tanstack-fetch</th>
            <th>axios</th>
            <th>ky</th>
            <th>ofetch</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in compareRows" :key="row.feature">
            <th>
              <a :href="withBase(row.href)">{{ row.feature }}</a>
            </th>
            <td :data-mark="row.fetch">{{ labelFor(row.fetch) }}</td>
            <td :data-mark="row.axios">{{ labelFor(row.axios) }}</td>
            <td :data-mark="row.ky">{{ labelFor(row.ky) }}</td>
            <td :data-mark="row.ofetch">{{ labelFor(row.ofetch) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul class="home-legend">
      <li data-mark="yes">First-class in the library</li>
      <li data-mark="partial">Possible, with extra adaptation</li>
      <li data-mark="no">Not a built-in feature</li>
    </ul>
  </section>
</template>
