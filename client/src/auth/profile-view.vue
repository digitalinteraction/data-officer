<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/main-layout.vue'
import { useAuthStore } from './auth-store'
import { getEndpoint, Routes } from '../utils'

interface Profile {
  fullName: string
  email: string
  phoneNumber: string
}

const router = useRouter()
const auth = useAuthStore()

const profile = ref<Profile | null>(null)

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

function boolean(value: unknown) {
  return value === true ? 'Yes' : 'No'
}

function onLogout() {
  auth.unauthenticate()
  router.replace(Routes.home)
}
</script>

<template>
  <MainLayout class="profileView">
    <center-layout v-if="profile">
      <box-layout borderWidth="0">
        <stack-layout>
          <section>
            <h1>My profile</h1>
          </section>
          <section>
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
          </section>

          <section>
            <stack-layout space="var(--s-1)">
              <div>
                <h2>Reminders</h2>
                <p>Update your reminder preferences</p>
              </div>

              <pre>UPDATE FORM GOES HERE</pre>

              <cluster-layout space="var(--s-1)">
                <button class="primaryButton">Update</button>
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

<style>
.profileView table {
  border-collapse: collapse;
  border-spacing: 0;
}

.profileView table th {
  text-align: right;
}
.profileView table th,
.profileView table td {
  border-width: 0;
  padding: var(--s-2) var(--s-3);
  vertical-align: top;
}

.profileView table th:not([algin]) {
  text-align: inherit;
}
</style>
