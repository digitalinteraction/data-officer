<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Routes } from '../utils'
import MainLayout from '../components/main-layout.vue'
import { useEntryStore } from './entry-store'

const entry = useEntryStore()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  const reminder =
    typeof route.query.reminder === 'string'
      ? parseInt(route.query.reminder)
      : null

  if (!Number.isNaN(reminder)) {
    entry.reminder = reminder
  }

  if (
    entry.submission.items.length < 1 &&
    route.name !== Routes.newEntry.name
  ) {
    router.replace(Routes.newEntry)
    return
  }
})

// TODO: remove any items from submission.items that have a source that has
//       since been unselected
</script>

<template>
  <MainLayout>
    <center-layout>
      <box-layout borderWidth="0" padding="var(--s0)">
        <stack-layout space="var(--s3)">
          <section>
            <h1>New entry</h1>
            <p>
              Create a new entry in your DataDiary. First, select all the
              relevant news sources from the list on this page then click 'next'
              to add details of each news story you've accessed for each source
              in the next page.
            </p>
          </section>

          <!-- Pages -->
          <router-view />
        </stack-layout>
      </box-layout>
    </center-layout>
  </MainLayout>
</template>
