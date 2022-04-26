<script lang="ts" setup>
import { computed } from 'vue'

import { Routes, SvgIcon } from '../utils'
import { useEntryStore } from './entry-store'
import DetailDiaryItem from './detail-diary-item.vue'

const entry = useEntryStore()
const nextRoute = computed(() => {
  return entry.submission.items.length < 2
    ? Routes.newEntryReview
    : Routes.newEntryCompare
})
</script>

<template>
  <stack-layout>
    <header>
      <h2>More detail</h2>
      <p>Lets think more about your interactions...</p>
    </header>

    <DetailDiaryItem v-for="item in entry.submission.items" :item="item" />

    <nav role="page controls">
      <cluster-layout space="var(--s-1)">
        <router-link :to="Routes.newEntryCollect" class="secondaryButton">
          <icon-layout>
            <SvgIcon name="left" />
            Back
          </icon-layout>
        </router-link>

        <router-link :to="nextRoute" class="primaryButton">
          <icon-layout>
            Next
            <SvgIcon name="right" />
          </icon-layout>
        </router-link>
      </cluster-layout>
    </nav>
  </stack-layout>
</template>
