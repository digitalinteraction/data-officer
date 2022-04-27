<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../auth/auth-store'
import MainLayout from '../components/main-layout.vue'
import { config, getEndpoint, Routes, SvgIcon } from '../utils'
import { DiaryEntry } from './entry-store'

const { entryId } = defineProps<{
  entryId: string
}>()

const auth = useAuthStore()
const entry = ref<DiaryEntry | null>(null)

onMounted(async () => {
  entry.value = await fetch(getEndpoint(`entries/${entryId}`), {
    headers: auth.requestHeaders,
  })
    .then((r) => r.json())
    .catch((e) => {
      console.error('Failed to fetch entry')
      return null
    })
})
</script>

<template>
  <MainLayout>
    <center-layout>
      <box-layout borderWidth="0" padding="var(--s0)">
        <stack-layout>
          <section>
            <h1>Entry</h1>
            <p>
              <router-link :to="Routes.entries">
                <icon-layout>
                  <SvgIcon name="left" />
                  My entries
                </icon-layout>
              </router-link>
            </p>
          </section>
          <section>
            <pre>{{ entry }}</pre>
          </section>
        </stack-layout>
      </box-layout>
    </center-layout>
  </MainLayout>
</template>
