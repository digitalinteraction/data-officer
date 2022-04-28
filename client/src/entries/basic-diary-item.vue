<script lang="ts" setup>
import { DiaryItem } from './entry-store'
import { SvgIcon, idFactory } from '../utils'

defineProps<{
  item: DiaryItem
}>()

defineEmits<{
  (e: 'remove'): void
}>()

const getId = idFactory()
</script>

<template>
  <fieldset>
    <legend>{{ item.origin || 'New diary item' }}</legend>

    <div class="field">
      <label :for="getId('origin')">
        <span class="field-label">Where was it from?</span>
      </label>
      <input type="text" :id="getId('origin')" v-model="item.origin" required />
    </div>

    <div class="field">
      <label :for="getId('organisation')">
        <span class="field-label">What organisation is it from?</span>
      </label>
      <input
        type="text"
        :id="getId('organisation')"
        v-model="item.organisation"
        required
      />
    </div>

    <div class="field">
      <label :for="getId('description')">
        <span class="field-label">What was it about?</span>
      </label>
      <input
        type="text"
        :id="getId('description')"
        v-model="item.description"
        required
      />
    </div>

    <div class="field">
      <label :for="getId('url')">
        <span class="field-label">Do you have the URL?</span>
        <span class="field-hint">Optional</span>
      </label>
      <input type="text" :id="getId('url')" v-model="item.url" />
    </div>

    <div class="field">
      <label :for="getId('when')">
        <span class="field-label">When did you access the information?</span>
      </label>
      <input type="text" :id="getId('when')" v-model="item.when" />
    </div>

    <div class="field">
      <label :for="getId('reason')">
        <span class="field-label">Why was this shared?</span>
      </label>
      <input type="text" :id="getId('reason')" v-model="item.reason" />
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
