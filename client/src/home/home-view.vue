<script lang="ts" setup>
import { useAuthStore } from '../auth/auth-store'
import MainLayout from '../components/main-layout.vue'
import { SvgIcon, Routes } from '../utils'

const auth = useAuthStore()
</script>

<template>
  <MainLayout class="homeView">
    <center-layout>
      <box-layout borderWidth="0" padding="var(--s0)">
        <stack-layout>
          <section>
            <h1>About</h1>
            <p>
              DataDiaries is a web application to record online news
              consumption.
            </p>
          </section>

          <section>
            <h2>How it works</h2>
            <p>
              Once you have set up a profile and indicated your preferences you
              will receive notifications by email or SMS to remind you to enter
              details of the online news you have accessed since the last
              notification. The app will take you through a set of simple forms
              where you are asked to indicate the content, source, and your
              perceptions of online news and information.
            </p>
          </section>

          <section>
            <h2>Study info</h2>
            <p>
              This is a study into the way people access and interact with
              online information to understand how people review and validate
              information online.
            </p>
          </section>

          <section v-if="!auth.isLoggedIn">
            <cluster-layout space="var(--s-1)">
              <router-link class="primaryButton" :to="Routes.register">
                <icon-layout>
                  Register
                  <SvgIcon name="right" />
                </icon-layout>
              </router-link>
              <router-link class="secondaryButton" :to="Routes.login">
                <icon-layout>
                  Sign in
                  <SvgIcon name="right" />
                </icon-layout>
              </router-link>
            </cluster-layout>
          </section>
        </stack-layout>
      </box-layout>
    </center-layout>
  </MainLayout>
</template>
