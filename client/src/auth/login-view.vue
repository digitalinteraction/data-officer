<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AltLayout from '../components/alt-layout.vue'
import { Routes, getEndpoint, FormState } from '../utils'

const formState = ref<FormState>('pending')

const route = useRoute()

if (route.query.error !== undefined) formState.value = 'error'
if (route.query.success !== undefined) formState.value = 'success'
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
      Something went wrong, please try again
    </p>

    <p class="formSuccessMessage" v-if="formState === 'success'">
      Magic link sent, please check your email.
    </p>

    <form :action="getEndpoint('auth/login')" method="post">
      <div class="field">
        <label for="email">
          <span class="field-label">Email address</span>
        </label>
        <input type="email" id="email" name="email" />
      </div>
      <cluster-layout space="var(--s-1)">
        <input
          type="submit"
          :disabled="formState === 'loading'"
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
