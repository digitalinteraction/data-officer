<script lang="ts" setup>
import { ref } from 'vue'
import { DiaryItem } from './entry-store'
import { SvgIcon, generateId } from '../utils'

defineProps<{
  item: DiaryItem
}>()

defineEmits<{
  (e: 'remove'): void
}>()

const _id = generateId()
function id(slug: string) {
  return `${slug}-${_id}`
}
</script>

<template>
  <fieldset>
    <legend>{{ item.origin || 'New diary item' }}</legend>

    <div class="field">
      <label :for="id('origin')">
        <span class="field-label">Where was it from?</span>
      </label>
      <input type="text" :id="id('origin')" v-model="item.origin" />
    </div>

    <div class="field">
      <label :for="id('organisation')">
        <span class="field-label">What organisation is it from?</span>
      </label>
      <input type="text" :id="id('organisation')" v-model="item.organisation" />
    </div>

    <div class="field">
      <label :for="id('description')">
        <span class="field-label">What was it about?</span>
      </label>
      <input type="text" :id="id('description')" v-model="item.description" />
    </div>

    <div class="field">
      <label :for="id('url')">
        <span class="field-label">Do you have the URL?</span>
        <span class="field-hint">Optional</span>
      </label>
      <input type="text" :id="id('url')" v-model="item.url" />
    </div>

    <div class="field">
      <label :for="id('when')">
        <span class="field-label">When did you access the information?</span>
      </label>
      <input type="text" :id="id('when')" v-model="item.when" />
    </div>

    <div class="newEntryCollect-itemActions">
      <button class="secondaryButton" @click="$emit('remove')">
        <icon-layout>
          <SvgIcon name="cross" />
          Remove
        </icon-layout>
      </button>
    </div>
  </fieldset>
</template>
