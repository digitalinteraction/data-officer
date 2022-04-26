<script lang="ts" setup>
import { Routes, SvgIcon } from '../utils'
import { useEntryStore } from './entry-store'
import DetailDiaryItem from './detail-diary-item.vue'

const entry = useEntryStore()
</script>

<template>
  <stack-layout>
    <div>
      <h2>More detail</h2>
      <p>Lets think more about your interactions...</p>
    </div>

    <DetailDiaryItem v-for="item in entry.submission.items" :item="item" />

    <cluster-layout space="var(--s-1)">
      <router-link :to="Routes.newEntryCollect" class="secondaryButton">
        <icon-layout>
          <SvgIcon name="left" />
          Back
        </icon-layout>
      </router-link>

      <router-link :to="Routes.newEntryCompare" class="primaryButton">
        <icon-layout>
          Next
          <SvgIcon name="right" />
        </icon-layout>
      </router-link>
    </cluster-layout>
  </stack-layout>
</template>
