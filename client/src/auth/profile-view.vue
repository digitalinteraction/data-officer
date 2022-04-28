<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/main-layout.vue'
import { useAuthStore } from './auth-store'
import { FormState, getEndpoint, Routes } from '../utils'
import ScheduleField from '../components/schedule-field.vue'

interface Profile {
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  reminders: { sms?: boolean; email?: boolean }
  reminderSchedule: string | null
}

const router = useRouter()
const auth = useAuthStore()

const updateState = ref<FormState>('pending')
const profile = ref<Profile | null>(null)
const update = ref({
  reminderSchedule: '' as string | null,
  reminders: {
    email: false,
    sms: false,
  },
})

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.replace(Routes.home)
    return
  }

  profile.value = await fetch(getEndpoint('auth/me'), {
    headers: auth.requestHeaders,
  })
    .then((r) => r.json())
    .catch((error) => {
      console.error('Failed to fetch profile', error)
      return null
    })
})

watch(profile, (profile) => {
  update.value.reminderSchedule = profile?.reminderSchedule ?? null
  update.value.reminders.email = profile?.reminders?.email ?? false
  update.value.reminders.sms = profile?.reminders?.sms ?? false
})

function onLogout() {
  auth.unauthenticate()
  router.replace(Routes.home)
}

async function onUpdate() {
  updateState.value = 'loading'

  const res = await fetch(getEndpoint('auth/me'), {
    method: 'post',
    headers: {
      ...auth.requestHeaders,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ...update.value,
    }),
  })

  updateState.value = res.ok ? 'success' : 'error'

  if (res.ok) profile.value = await res.json()
}
</script>

<template>
  <MainLayout class="profileView">
    <center-layout v-if="profile">
      <box-layout borderWidth="0">
        <stack-layout space="var(--s3)">
          <section>
            <stack-layout space="var(--s-1)">
              <h1>My profile</h1>

              <table class="table">
                <tbody>
                  <tr>
                    <th>Full name</th>
                    <td>{{ profile.fullName }}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{{ profile.email }}</td>
                  </tr>
                  <tr>
                    <th>Phone number</th>
                    <td>{{ profile.phoneNumber ?? 'Not set' }}</td>
                  </tr>
                </tbody>
              </table>
            </stack-layout>
          </section>

          <section>
            <stack-layout space="var(--s-1)">
              <div>
                <h2>Reminders</h2>
                <p>Update your reminder preferences</p>
              </div>

              <div class="formSuccessMessage" v-if="updateState === 'success'">
                Your reminders have been updated
              </div>

              <div class="formErrorMessage" v-if="updateState === 'error'">
                Could not update your reminders, please check through and try
                again.
              </div>

              <div class="checkboxGroup">
                <label for="emailReminders" class="checkbox">
                  <input
                    type="checkbox"
                    id="emailReminders"
                    value="email"
                    v-model="update.reminders.email"
                    :disabled="updateState === 'loading'"
                  />
                  <span>Notify me by email</span>
                </label>
                <label for="smsReminders" class="checkbox">
                  <input
                    type="checkbox"
                    id="smsReminders"
                    value="sms"
                    v-model="update.reminders.sms"
                    :disabled="updateState === 'loading'"
                  />
                  <span>Notify me by SMS</span>
                </label>
              </div>

              <ScheduleField
                v-model="update.reminderSchedule"
                :disabled="updateState === 'loading'"
              />

              <cluster-layout space="var(--s-1)">
                <button
                  class="primaryButton"
                  @click="onUpdate"
                  :disabled="updateState === 'loading'"
                >
                  Update reminders
                </button>
              </cluster-layout>
            </stack-layout>
          </section>

          <section>
            <stack-layout space="var(--s-1)">
              <h2>Actions</h2>
              <cluster-layout space="var(--s-1)">
                <button class="primaryButton" @click="onLogout">Log out</button>
              </cluster-layout>
            </stack-layout>
          </section>
        </stack-layout>
      </box-layout>
    </center-layout>
  </MainLayout>
</template>
