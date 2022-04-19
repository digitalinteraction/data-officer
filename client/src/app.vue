<template>
  <router-view></router-view>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { useAuthStore } from './auth/auth-store'
import { emitMetric } from './utils'

const auth = useAuthStore()

onMounted(() => {
  auth.setup()
  emitMetric('hello', { message: 'world' })
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
