<script lang="ts" setup>
import { computed } from 'vue'
import { idFactory, Routes, SvgIcon } from '../utils'
import { DiaryItem, useEntryStore } from './entry-store'

const entry = useEntryStore()

const hasStories = computed(() => {
  return entry.submission.items.length > 0
})

function addStory() {
  entry.addItem('')
}
function removeStory(item: DiaryItem) {
  entry.removeItem(item)
}
function getItemId(item: DiaryItem) {
  return `story-${item.id}`
}
</script>

<template>
  <stack-layout>
    <fieldset v-for="item in entry.submission.items">
      <div class="field">
        <label :for="getItemId(item)">
          <span class="field-label">What did you learn?</span>
          <input
            type="text"
            :id="getItemId(item)"
            name="getItemId(item)"
            v-model="item.description"
          />
        </label>
      </div>

      <cluster-layout style="font-size: 0.8em">
        <button class="secondaryButton" @click="removeStory(item)">
          <icon-layout>
            <SvgIcon name="cross" />
            Remove story
          </icon-layout>
        </button>
      </cluster-layout>
    </fieldset>

    <cluster-layout>
      <button class="primaryButton" @click="addStory">
        <icon-layout>
          <SvgIcon name="plus" />
          Add a story
        </icon-layout>
      </button>
    </cluster-layout>
  </stack-layout>

  <cluster-layout space="var(--s-1)" v-if="hasStories">
    <router-link :to="Routes.newEntryCollect" class="primaryButton">
      <icon-layout>
        <span>Next </span>
        <SvgIcon name="right" />
      </icon-layout>
    </router-link>
  </cluster-layout>

  <p class="formSuccessMessage" v-if="!hasStories">
    If you haven't seen any news theres no need to make a diary entry!
    <router-link :to="Routes.entries">Go to my entries</router-link>.
  </p>
</template>
