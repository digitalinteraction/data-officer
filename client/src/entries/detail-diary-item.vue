<script lang="ts" setup>
import { DiaryItem } from './entry-store'
import { idFactory } from '../utils'

defineProps<{
  item: DiaryItem
}>()

const getId = idFactory()
</script>

<template>
  <fieldset>
    <legend>{{ item.origin }}</legend>

    <div class="field">
      <label :for="getId('trust')">
        <span class="field-label">How much do you trust this?</span>
      </label>
      <input
        type="range"
        min="0"
        max="100"
        v-model="item.trust"
        :id="getId('trust')"
      />
    </div>

    <div class="field">
      <label :for="getId('importance')">
        <span class="field-label">How much important is this?</span>
      </label>
      <input
        type="range"
        min="0"
        max="100"
        v-model="item.importance"
        :id="getId('importance')"
      />
    </div>

    <div class="field">
      <label :for="getId('feeling')">
        <span class="field-label">How did it make you feel?</span>
      </label>
      <textarea
        :id="getId('feeling')"
        v-model="item.feeling"
        rows="3"
      ></textarea>
    </div>

    <div class="field">
      <label :for="getId('nextAction')">
        <span class="field-label">What did you do next?</span>
      </label>
      <textarea
        :id="getId('nextAction')"
        v-model="item.nextActions"
        rows="3"
      ></textarea>
    </div>
  </fieldset>
</template>
