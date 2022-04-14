<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AltLayout from '../components/alt-layout.vue'
import { useAuthStore } from '../auth/auth-store'
import { Routes, config } from '../utils'

const formAction = new URL('auth/login', config.SERVER_URL).toString()

const route = useRoute()
const router = useRouter()
const action = ref('none')
const auth = useAuthStore()

if (route.query.error !== undefined) action.value = 'error'
if (route.query.success !== undefined) action.value = 'success'

if (route.hash) {
  const params = new URLSearchParams(route.hash.slice(1))
  const token = params.get('token')
  if (token) {
    auth.authenticate(token)
  }
}
</script>

<template>
  <AltLayout class="loginView">
    <center-layout>
      <box-layout borderWidth="1" padding="var(--s0)">
        <stack-layout space="var(--s0)">
          <h1>Log in</h1>
          <p>
            Don't have an account?
            <router-link :to="Routes.register">Register</router-link>
          </p>

          <p>
            Enter your email to log in to DataDiaries, we'll send you an email
            with a magic link in it. Click that link to log in.
          </p>

          <p class="loginView-error" v-if="action === 'error'">
            Something went wrong, please try again
          </p>

          <p class="loginView-success" v-if="action === 'success'">
            Magic link sent, please check your email.
          </p>

          <form :action="formAction" method="post">
            <div class="field">
              <label for="email">
                <span class="field-label">Email address</span>
                <!-- <span class="field-hint">And some help</span> -->
              </label>
              <input type="email" id="email" name="email" />
            </div>
            <input
              type="submit"
              class="primaryButton"
              name="login"
              value="Send magic link"
            />
          </form>
        </stack-layout>
      </box-layout>
    </center-layout>
  </AltLayout>
</template>

<style>
.loginView-error {
  border-radius: 5px;
  border: 5px solid rgba(255, 0, 0, 0.7);
  background: rgba(255, 0, 0, 0.1);
  padding: 0.5rem;
}
.loginView-success {
  border-radius: 5px;
  border: 5px solid rgba(0, 200, 0, 0.9);
  background: rgba(0, 255, 0, 0.1);
  padding: 0.5rem;
}
</style>
