<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../auth/auth-store'
import MainLayout from '../components/main-layout.vue'
import { getEndpoint, Routes, SvgIcon } from '../utils'
import { DiaryEntry, getSourceName } from './entry-store'

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

const longDate = new Intl.DateTimeFormat(['en-gb'], {
  dateStyle: 'long',
  timeStyle: 'short',
})
</script>

<template>
  <MainLayout>
    <center-layout>
      <box-layout borderWidth="0" padding="var(--s0)">
        <stack-layout v-if="entry">
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
            <p>
              <strong>Created</strong>:
              {{ longDate.format(new Date(entry.created)) }}
            </p>
            <p v-if="entry.response.reminder">
              <strong>Reminder</strong>: #{{ entry.response.reminder }}
            </p>
          </section>
          <section v-for="item in entry.response.items">
            <h2>{{ getSourceName(item.source) }} / {{ item.origin }}</h2>
            <switcher-layout threshold="22em">
              <dl>
                <dt>Source</dt>
                <dd>{{ item.source }}</dd>
                <dt>Origin</dt>
                <dd>{{ item.origin }}</dd>
                <dt>Organisation</dt>
                <dd>{{ item.organisation }}</dd>
                <dt>Description</dt>
                <dd>{{ item.description }}</dd>
                <template v-if="item.url">
                  <dt>URL</dt>
                  <dd>
                    <a :href="item.url">{{ item.url }}</a>
                  </dd>
                </template>
                <dt>When</dt>
                <dd>{{ item.when }}</dd>
                <dt>How</dt>
                <dd>{{ item.how }}</dd>
                <dt>Reason</dt>
                <dd>{{ item.reason }}</dd>
              </dl>
              <dl>
                <dt>Trust</dt>
                <dd>{{ item.trust }}/100</dd>
                <dt>Importance</dt>
                <dd>{{ item.importance }}/100</dd>
                <dt>Feeling</dt>
                <dd>{{ item.feeling }}</dd>
                <dt>Next actions</dt>
                <dd>{{ item.nextActions }}</dd>
              </dl>
            </switcher-layout>
          </section>
        </stack-layout>
      </box-layout>
    </center-layout>
  </MainLayout>
</template>
