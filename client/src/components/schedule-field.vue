<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'

const { modelValue } = defineProps<{
  modelValue: string | null
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', newValue: string | null): void
}>()

const allDays = [
  { value: '1', id: 'mon', name: 'Monday' },
  { value: '2', id: 'tue', name: 'Tuesday' },
  { value: '3', id: 'wed', name: 'Wednesday' },
  { value: '4', id: 'thur', name: 'Thursday' },
  { value: '5', id: 'fri', name: 'Friday' },
  { value: '6', id: 'sat', name: 'Saturday' },
  { value: '0', id: 'sun', name: 'Sunday' },
]

const allTimes = [
  { value: '8', id: '8am', name: '8am' },
  { value: '12', id: '12pm', name: '12pm' },
  { value: '15', id: '3pm', name: '3pm' },
  { value: '18', id: '6pm', name: '6pm' },
]

const reminderHours = ref<string[]>([])
const reminderDays = ref<string[]>([])

onMounted(() => {
  if (modelValue) {
    const split = modelValue.split(/\s+/)
    reminderHours.value = split[1].split(',')
    reminderDays.value = split[4].split(',')
  }
})

watch(reminderDays, (newValue) => {
  emit('update:modelValue', buildCron(newValue, reminderHours.value))
})
watch(reminderHours, (newValue) => {
  emit('update:modelValue', buildCron(reminderDays.value, newValue))
})

function buildCron(days: string[], hours: string[]): string | null {
  if (days.length === 0 || hours.length === 0) return null
  return `0 ${hours.join(',')} * * ${days.join(',')}`
}
</script>

<template>
  <switcher-layout threshold="22em">
    <div class="checkboxGroup">
      <p class="checkboxGroup-label">Days</p>
      <label class="checkbox" v-for="item in allDays" :for="item.id">
        <input
          type="checkbox"
          :id="item.id"
          name="reminderDays"
          v-model="reminderDays"
          :value="item.value"
          :disabled="disabled"
        />
        <span>{{ item.name }}</span>
      </label>
    </div>

    <div class="checkboxGroup">
      <p class="checkboxGroup-label">Times</p>
      <label class="checkbox" v-for="item in allTimes" :for="item.id">
        <input
          type="checkbox"
          :id="item.id"
          name="reminderHours"
          v-model="reminderHours"
          :value="item.value"
          :disabled="disabled"
        />
        <span>{{ item.name }}</span>
      </label>
    </div>
  </switcher-layout>
</template>
