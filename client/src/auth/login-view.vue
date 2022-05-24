<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AltLayout from '../components/alt-layout.vue'
import { Routes, getEndpoint, FormState } from '../utils'

const email = ref('')
const formState = ref<FormState>('pending')

const route = useRoute()
const isLoading = computed(() => formState.value === 'loading')

if (route.query.error !== undefined) formState.value = 'error'
if (route.query.success !== undefined) formState.value = 'success'

async function onSubmit() {
  formState.value === 'loading'

  const res = await fetch(getEndpoint('auth/login'), {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: email.value,
    }),
  })

  formState.value = res.ok ? 'success' : 'error'
}
</script>

<template>
  <AltLayout class="loginView">
    <h1>Log in</h1>
    <p>
      Don't have an account?
      <router-link :to="Routes.register">Register</router-link>
    </p>

    <p>
      Enter your email to log in to DataDiaries, we'll send you an email with a
      magic link in it. Click that link to log in.
    </p>

    <p class="formErrorMessage" v-if="formState === 'error'">
      Something went wrong, please check the form and try again again.
    </p>

    <p class="formSuccessMessage" v-if="formState === 'success'">
      Magic link sent, please check your email.
    </p>

    <form @submit.prevent="onSubmit">
      <div class="field">
        <label for="email">
          <span class="field-label">Email address</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          v-model="email"
          required
          :disabled="isLoading"
          enterkeyhint="send"
        />
      </div>

      <cluster-layout space="var(--s-1)">
        <input
          type="submit"
          :disabled="isLoading"
          class="primaryButton"
          name="login"
          value="Send magic link"
        />

        <router-link :to="Routes.home" class="secondaryButton">
          Cancel
        </router-link>
      </cluster-layout>
    </form>
  </AltLayout>
</template>
