<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../auth/auth-store'
import MainLayout from '../components/main-layout.vue'
import { DiaryEntry } from './entry-store'
import { SvgIcon, Routes, getEndpoint } from '../utils'

const auth = useAuthStore()

const entries = ref<DiaryEntry[] | null>(null)

onMounted(async () => {
  entries.value = await fetch(getEndpoint('entries'), {
    headers: auth.requestHeaders,
  })
    .then((r) => r.json())
    .catch((e) => {
      console.error('Failed to fetch entries')
      return null
    })
})

function formatDate(input: string) {
  const d = new Date(input)
  return d.toLocaleString()
}

function entryRoute(entry: DiaryEntry) {
  return {
    ...Routes.entry,
    params: { entryId: entry.id.toString() },
  }
}
</script>

<template>
  <MainLayout>
    <center-layout>
      <box-layout borderWidth="0" padding="var(--s0)">
        <stack-layout>
          <section>
            <h1>My entries</h1>
            <p>
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Fuga
              aperiam error dolorem accusamus maxime suscipit, aliquid magnam
              alias deleniti harum? Eum eligendi maiores ullam fugit at
              voluptates, eveniet praesentium nulla?
            </p>
          </section>
          <section>
            <ol>
              <li v-for="entry in entries">
                <router-link :to="entryRoute(entry)">
                  <icon-layout>
                    {{ formatDate(entry.created) }}
                    <SvgIcon name="right" />
                  </icon-layout>
                </router-link>
              </li>
            </ol>
          </section>
        </stack-layout>
      </box-layout>
    </center-layout>
  </MainLayout>
</template>
