<template>
  <router-view></router-view>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './auth/auth-store'

const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  auth.setup()

  if (location.hash) {
    const params = new URLSearchParams(location.hash.slice(1))

    const token = params.get('token')
    if (token) auth.authenticate(token)

    const next = params.get('next')
    if (next && auth.isLoggedIn) router.replace(next)
  }
})
</script>

<style>
@import '@openlab/alembic/reset.css';
@import '@openlab/alembic/layouts.css';
@import './assets/inter/inter.css';

@import './css/vars.css';
@import './css/globals.css';
@import './css/ui.css';
@import './css/forms.css';
</style>
