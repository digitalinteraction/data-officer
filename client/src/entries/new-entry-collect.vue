<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Routes, SvgIcon } from '../utils'
import { useEntryStore, entrySources, DiaryItem } from './entry-store'
import BasicDiaryItem from './basic-diary-item.vue'

const entry = useEntryStore()

function addItem() {
  entry.addItem('')
}
function removeItem(item: DiaryItem) {
  entry.removeItem(item)
}
</script>

<template>
  <stack-layout class="newEntryCollect">
    <!-- <header>
      <h2>{{ currentSource.name }}</h2>
      <p>
        {{ currentSource.question }}
      </p>
    </header> -->

    <BasicDiaryItem
      v-for="item in entry.submission.items"
      :item="item"
      @remove="removeItem(item)"
    />

    <div>
      <button class="primaryButton" @click="addItem">
        <icon-layout>
          <SvgIcon name="plus" />
          Add
        </icon-layout>
      </button>
    </div>
  </stack-layout>

  <cluster-layout space="var(--s-1)">
    <!--
      Previous button
    -->
    <router-link :to="Routes.newEntry" class="secondaryButton">
      <icon-layout>
        <SvgIcon name="left" />
        Back
      </icon-layout>
    </router-link>

    <!--
      Next button
    -->

    <router-link :to="Routes.newEntryDetails" class="primaryButton">
      <icon-layout>
        Next
        <SvgIcon name="right" />
      </icon-layout>
    </router-link>
  </cluster-layout>
</template>

<style>
.newEntryCollect-itemActions {
  font-size: 0.8em;
}
</style>
