<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
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
    .then((entries: DiaryEntry[]) =>
      entries.map((e) => ({
        ...e,
        created: new Date(e.created),
      }))
    )
    .catch((error) => {
      console.error('Failed to fetch entries', error)
      return null
    })
})

const longDate = new Intl.DateTimeFormat(['en'], {
  dateStyle: 'long',
  timeStyle: 'short',
})

function entryRoute(entry: DiaryEntry) {
  return {
    ...Routes.entry,
    params: { entryId: entry.id.toString() },
  }
}

const sortedEntries = computed(() => {
  if (!entries.value) return []

  return [...entries.value].sort(
    (a, b) => b.created.getTime() - a.created.getTime()
  )
})
</script>

<template>
  <MainLayout>
    <center-layout>
      <box-layout borderWidth="0" padding="var(--s0)">
        <stack-layout>
          <section>
            <h1>My entries</h1>
            <p>
              This page shows each DataDiary entry you have submitted. Click on
              an entry for more details.
            </p>
          </section>
          <section>
            <ol>
              <li v-for="entry in sortedEntries">
                <router-link :to="entryRoute(entry)">
                  <icon-layout>
                    {{ longDate.format(entry.created) }}
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
