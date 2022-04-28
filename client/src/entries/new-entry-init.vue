<script lang="ts" setup>
import { computed } from 'vue'
import { Routes, SvgIcon } from '../utils'
import { useEntryStore, entrySources } from './entry-store'

const entry = useEntryStore()

function onCancel() {
  console.log('...')
}

/** Remove previously created items if the source has been removed */
function onNext() {
  const sourceSet = new Set(entry.submission.sources)
  entry.submission.items = entry.submission.items.filter((s) =>
    sourceSet.has(s.source)
  )
}

const hasNews = computed(() => {
  return entry.submission.sources.length > 0
})
</script>

<template>
  <fieldset>
    <legend>News source</legend>
    <p class="fieldset-hint">
      These questions get you thinking about how you've accessed news or online
      information recently.
    </p>
    <div class="checkboxGroup">
      <p class="checkboxGroup-label">How have you accessed news recently?</p>
      <label class="checkbox" v-for="item in entrySources" :for="item.id">
        <input
          type="checkbox"
          :id="item.id"
          name="newsSource"
          v-model="entry.submission.sources"
          :value="item.id"
        />
        <span>{{ item.label }}</span>
      </label>
    </div>
  </fieldset>

  <cluster-layout space="var(--s-1)" v-if="hasNews">
    <!-- <button class="secondaryButton" @click="onCancel">
      <icon-layout>
        <span> Cancel </span>
        <SvgIcon name="cross" />
      </icon-layout>
    </button> -->

    <router-link
      :to="Routes.newEntryCollect"
      class="primaryButton"
      @click="onNext"
    >
      <icon-layout>
        <span>Next </span>
        <SvgIcon name="right" />
      </icon-layout>
    </router-link>
  </cluster-layout>

  <p class="formSuccessMessage" v-if="!hasNews">
    If you haven't seen any news theres no need to make a diary entry!
    <router-link :to="Routes.entries">Go to my entries</router-link>.
  </p>
</template>
