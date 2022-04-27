<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../auth/auth-store'
import MainLayout from '../components/main-layout.vue'
import { DiaryEntry } from './entry-store'
import { SvgIcon, config } from '../utils'

const auth = useAuthStore()

const entries = ref<DiaryEntry[] | null>(null)

onMounted(async () => {
  entries.value = await fetch(
    new URL('entries', config.SERVER_URL).toString(),
    { headers: { ...auth.requestHeaders } }
  ).then(
    (r) => r.json() as Promise<DiaryEntry[]>,
    (e) => {
      console.error('Failed to fetch entries')
      return null
    }
  )
})

function formatDate(input: string) {
  const d = new Date(input)
  return d.toLocaleString()
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
                <icon-layout>
                  {{ formatDate(entry.created) }}
                  <SvgIcon name="right" />
                </icon-layout>
              </li>
            </ol>
          </section>
        </stack-layout>
      </box-layout>
    </center-layout>
  </MainLayout>
</template>
