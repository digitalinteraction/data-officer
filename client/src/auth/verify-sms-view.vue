<script lang="ts" setup>
import AltLayout from '../components/alt-layout.vue'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const verifyState = ref<'error' | 'success'>('error')
const route = useRoute()

if (route.query.error !== undefined) verifyState.value = 'error'
if (route.query.success !== undefined) verifyState.value = 'success'
</script>

<template>
  <AltLayout>
    <template v-if="verifyState === 'error'">
      <h1>SMS verification failed</h1>
      <p class="formErrorMessage">
        We couldn't verify your phone number, please close this window and try
        again
      </p>
    </template>

    <template v-if="verifyState === 'success'">
      <h1>SMS verified</h1>
      <p class="formSuccessMessage">
        Thanks for verifying your phone number, we can now send you SMS
        reminders to fill in your DataDiary. You can now close this window.
      </p>
    </template>
  </AltLayout>
</template>
