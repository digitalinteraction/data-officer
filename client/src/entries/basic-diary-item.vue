<script lang="ts" setup>
import { DiaryItem, entrySources } from './entry-store'
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

    <p class="fieldset-hint" v-if="item.description">
      "{{ item.description }}"
    </p>

    <div class="field">
      <label :for="getId('source')">
        <span class="field-label">
          Please select where you accessed the story
        </span>
      </label>
      <select :id="getId('source')" v-model="item.source">
        <option v-for="source in entrySources" :value="source.id">
          {{ source.label }}
        </option>
      </select>
    </div>

    <div class="field">
      <label :for="getId('origin')">
        <span class="field-label">Where was it from?</span>
        <span class="field-hint">
          Please indicate the social media, messaging app, or website
        </span>
      </label>
      <input type="text" :id="getId('origin')" v-model="item.origin" required />
    </div>

    <div class="field">
      <label :for="getId('organisation')">
        <span class="field-label">What was the source of the news story?</span>
        <span class="field-hint">
          e.g., BBC, Mail Online, BuzzFeed, Individual user
        </span>
      </label>
      <input
        type="text"
        :id="getId('organisation')"
        v-model="item.organisation"
        required
      />
    </div>

    <div class="field">
      <label :for="getId('url')">
        <span class="field-label">Do you have the URL?</span>
        <span class="field-hint">Leave blank if not</span>
      </label>
      <input type="text" :id="getId('url')" v-model="item.url" />
    </div>

    <div class="field">
      <label :for="getId('when')">
        <span class="field-label">
          What time did you access the information?
        </span>
        <span class="field-hint">
          Please indicate an estimate of the time you accessed it
        </span>
      </label>
      <input type="time" :id="getId('when')" v-model="item.when" step="600" />
    </div>

    <div class="field">
      <label :for="getId('how')">
        <span class="field-label">How did you access the information?</span>
        <span class="field-hint">
          For example, where you were and on what device, e.g., on mobile while
          traveling on a bus, at your desk at work on laptop, etc
        </span>
      </label>
      <input type="text" :id="getId('how')" v-model="item.how" />
    </div>

    <div class="field">
      <label :for="getId('reason')">
        <span class="field-label">Was this shared with you?</span>
        <span class="field-hint">
          If applicable indicate who shared this and the reason this was shared
          with you, if known
        </span>
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
