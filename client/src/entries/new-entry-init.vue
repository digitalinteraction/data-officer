<script lang="ts" setup>
import { computed } from 'vue'
import { Routes, SvgIcon } from '../utils'
import { useEntryStore, entrySources } from './entry-store'

const entry = useEntryStore()

function onCancel() {
  console.log('...')
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

  <cluster-layout space="var(--s-1)" align="center" v-if="hasNews">
    <button class="secondaryButton" @click="onCancel">
      <icon-layout>
        <span> Cancel </span>
        <SvgIcon name="cross" />
      </icon-layout>
    </button>

    <router-link :to="Routes.newEntryCollect" class="primaryButton">
      <icon-layout>
        <span>Next </span>
        <SvgIcon name="right" />
      </icon-layout>
    </router-link>
  </cluster-layout>

  <p class="formSuccessMessage" v-if="!hasNews">
    If you haven't seen any news theres no need to make a diary entry!
  </p>
</template>
