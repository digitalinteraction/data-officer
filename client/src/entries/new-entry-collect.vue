<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { Routes, SvgIcon } from '../utils'
import { useEntryStore, entrySources, DiaryItem } from './entry-store'
import BasicDiaryItem from './basic-diary-item.vue'

const entry = useEntryStore()

const sourceIndex = ref(0)
const chosenSources = computed(() => entry.submission.sources)
const currentSource = computed(() => {
  return entrySources.find(
    (source) => source.id === entry.submission.sources[sourceIndex.value]
  )!
})

onMounted(() => {
  for (const source of chosenSources.value) {
    const items = entry.submission.items.filter((i) => i.source === source)
    if (items.length === 0) entry.addItem(source)
  }
})

const currentItems = computed(() => {
  return entry.submission.items.filter(
    (item) => item.source === currentSource.value.id
  )
})

function addItem() {
  entry.addItem(chosenSources.value[sourceIndex.value])
}
function removeItem(item: DiaryItem) {
  entry.removeItem(item)
}
function onPage(change: number) {
  sourceIndex.value += change
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <stack-layout v-if="currentSource" class="newEntryCollect">
    <header>
      <h2>{{ currentSource.name }}</h2>
      <p>
        {{ currentSource.question }}
      </p>
    </header>

    <BasicDiaryItem
      v-for="item in currentItems"
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
    <router-link
      v-if="sourceIndex == 0"
      :to="Routes.newEntry"
      class="secondaryButton"
    >
      <icon-layout>
        <SvgIcon name="left" />
        Back
      </icon-layout>
    </router-link>

    <button v-else @click="onPage(-1)" class="secondaryButton">
      <icon-layout>
        <SvgIcon name="left" />
        Back
      </icon-layout>
    </button>

    <!--
      Next button
    -->

    <router-link
      v-if="sourceIndex + 1 >= chosenSources.length"
      :to="Routes.newEntryDetails"
      class="primaryButton"
    >
      <icon-layout>
        Next
        <SvgIcon name="right" />
      </icon-layout>
    </router-link>

    <button v-else class="primaryButton" @click="onPage(1)">
      <icon-layout>
        Next
        <SvgIcon name="right" />
      </icon-layout>
    </button>
  </cluster-layout>
</template>

<style>
.newEntryCollect-itemActions {
  font-size: 0.8em;
}
</style>
