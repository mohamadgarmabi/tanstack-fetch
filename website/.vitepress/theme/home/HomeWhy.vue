<script setup lang="ts">
import { withBase } from 'vitepress'
import { whyAxios } from './home.content'
</script>

<template>
  <section class="home-why">
    <div class="home-section-head">
      <p class="home-eyebrow">Why not axios?</p>
      <h2>Same job. Query-shaped answer.</h2>
      <p class="home-lead">
        axios, ky, and ofetch are solid HTTP clients. tanstack-fetch is shaped for the call site
        TanStack Query already expects.
      </p>
    </div>

    <ul>
      <li v-for="item in whyAxios" :key="item.title">
        <h3>{{ item.title }}</h3>
        <p>{{ item.text }}</p>
      </li>
    </ul>

    <p class="home-why-link">
      <a :href="withBase('/guide/comparison')">Read the full comparison</a>
    </p>
  </section>
</template>
