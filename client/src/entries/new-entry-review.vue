<script lang="ts" setup>
import { computed, ref } from 'vue'
import { FormState, Routes, SvgIcon } from '../utils'
import { useEntryStore } from './entry-store'

const formState = ref<FormState>('pending')
const entry = useEntryStore()

const prevRoute = computed(() => {
  return entry.submission.items.length > 1
    ? Routes.newEntryCompare
    : Routes.newEntryDetails
})

async function onSubmit() {
  try {
    // const res = await fetch()
  } catch (error) {
    console.error(error)
    formState.value = 'error'
  }
}
</script>

<template>
  <section class="formSuccessMessage" v-if="formState === 'success'">
    <p space="var(--s-1)">
      Your DataDiary entry has been submitted. Thank you for contribution. To
      see it go to
      <router-link :to="Routes.entries"> My entries </router-link>.
    </p>
  </section>

  <stack-layout v-else>
    <header>
      <h2>Review time</h2>
      <p>If you're happy with everything, lets submit!</p>
    </header>

    <section class="formErrorMessage" v-if="formState === 'error'">
      <p>
        There is something wrong with your submission, please check back through
        it and try again.
      </p>
    </section>

    <section>
      <p><strong>Entries</strong></p>
      <ul>
        <li v-for="item in entry.submission.items">
          {{ item.source }} &dash; {{ item.origin }}
        </li>
      </ul>
    </section>

    <cluster-layout space="var(--s-1)">
      <router-link :to="prevRoute" class="secondaryButton">
        <icon-layout>
          <SvgIcon name="left" />
          Back
        </icon-layout>
      </router-link>

      <button
        class="primaryButton"
        @click="onSubmit"
        :disabled="formState === 'loading'"
      >
        Submit
      </button>
    </cluster-layout>
  </stack-layout>
</template>
