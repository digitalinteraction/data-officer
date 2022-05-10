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
        <span class="field-hint">Please indicate the app or website</span>
      </label>
      <input type="text" :id="getId('origin')" v-model="item.origin" required />
    </div>

    <div class="field">
      <label :for="getId('organisation')">
        <span class="field-label">What organisation was it from?</span>
        <span class="field-hint">e.g., BBC, Mail, local news site</span>
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
        <span class="field-hint"
          >Give us an idea of the content, or the headline</span
        >
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
        <span class="field-hint">Roughly</span>
      </label>
      <input type="text" :id="getId('when')" v-model="item.when" />
    </div>

    <div class="field">
      <label :for="getId('how')">
        <span class="field-label">How did you access the information?</span>
        <span class="field-hint"
          >For example, where you were and what you were doing; traveling on a
          bus on mobile, at your desk at work on laptop, etc.</span
        >
      </label>
      <input type="text" :id="getId('how')" v-model="item.how" />
    </div>

    <div class="field">
      <label :for="getId('reason')">
        <span class="field-label">Why was this shared?</span>
        <span class="field-hint"
          >Optional, if applicable indicate the reason this was shared with you,
          if known</span
        >
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
