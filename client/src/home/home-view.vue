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
              This is a study about your relationship with online information to
              learn how people review and validate information online.
            </p>
          </section>

          <section>
            <h2>Overview</h2>
            <p>
              Forget the fat lady! You're obsessed with the fat lady! Drive us
              out of here! Do you have any idea how long it takes those cups to
              decompose. Life finds a way. Jaguar shark! So tell me - does it
              really exist? Hey, you know how I'm, like, always trying to save
              the planet? Here's my chance.
            </p>
          </section>

          <section>
            <h2>How it works</h2>
            <p>
              You know what? It is beets. I've crashed into a beet truck. I gave
              it a cold? I gave it a virus. A computer virus. Yeah, but your
              scientists were so preoccupied with whether or not they could,
              they didn't stop to think if they should. Hey, you know how I'm,
              like, always trying to save the planet? Here's my chance.
            </p>
          </section>

          <section>
            <h2>Study info</h2>
            <p>
              Remind me to thank John for a lovely weekend. So you two dig up,
              dig up dinosaurs? We gotta burn the rain forest, dump toxic waste,
              pollute the air, and rip up the OZONE! 'Cause maybe if we screw up
              this planet enough, they won't want it anymore! Is this my
              espresso machine? Wh-what is-h-how did you get my espresso
              machine?
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

<style>
.homeView {
}
.homeView-register,
.homeView-login {
  /* font-size: var(--s1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  padding: 0.2em 0.8em;
  font-weight: 600; */
}
.homeView-register {
  /* color: white;
  background: #238fef; */
}
.homeView-login {
  /* color: white;
  background: #20accd; */
}
</style>
