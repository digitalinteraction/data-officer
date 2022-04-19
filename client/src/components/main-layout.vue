<script lang="ts" setup>
import { ref } from 'vue'
import { useAuthStore } from '../auth/auth-store'
import { SvgIcon, Routes } from '../utils'
import MainBrand from './main-brand.vue'
import MainFooter from './main-footer.vue'

const auth = useAuthStore()

function toggleMenu() {
  showMobileMenu.value = !showMobileMenu.value
}

const showMobileMenu = ref(false)

function logout() {
  auth.unauthenticate()
}
</script>

<template>
  <div class="mainLayout">
    <!-- HEADER -->
    <header class="mainLayout-header" aria-label="header">
      <MainBrand />
      <button
        class="mainLayout-navToggle"
        :aria-expanded="showMobileMenu"
        @click="toggleMenu"
      >
        <icon-layout label="menu">
          <SvgIcon :name="showMobileMenu ? 'cross' : 'menu'" />
          Menu
        </icon-layout>
      </button>

      <nav class="mainLayout-nav" aria-label="main">
        <router-link :to="Routes.home" class="mainLayout-navItem"
          >About</router-link
        >

        <template v-if="auth.isLoggedIn">
          <router-link :to="Routes.entries" class="mainLayout-navItem">
            My Entries
          </router-link>
          <router-link :to="Routes.newEntry" class="mainLayout-navItem">
            New Entry
          </router-link>
          <router-link
            :to="Routes.home"
            @click="logout"
            class="mainLayout-navItem"
          >
            Log out
          </router-link>
        </template>

        <template v-else>
          <router-link :to="Routes.register" class="mainLayout-navItem">
            Register
          </router-link>
          <router-link :to="Routes.login" class="mainLayout-navItem">
            Log in
          </router-link>
        </template>
      </nav>
    </header>

    <!-- MAIN -->
    <main class="mainLayout-main">
      <slot></slot>
    </main>

    <!-- FOOTER -->
    <MainFooter />
  </div>
</template>

<style>
.mainLayout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.mainLayout-header {
  padding: var(--s-2) var(--s-1);
  border-bottom-width: var(--border-thin);

  display: flex;
  justify-content: space-between;
  gap: var(--s0);
}
.mainLayout-nav {
  display: flex;
  gap: var(--s0);
  align-items: center;
}
.mainLayout-navToggle {
  border: 1px solid black;
  border-radius: 4px;
  padding: 4px 6px;
  display: none;
  text-align: center;
  background-color: transparent;
  text-decoration: none;
  line-height: 1;
  font-size: 1.2rem;
  font-weight: 400;
}
.mainLayout-navItem {
  color: black;
}
.mainLayout-navButton {
  background-color: var(--color-light);
  color: var(--color-dark);
  font-size: 16px;
  padding: 0.25em 0.75em;
  font-weight: 500;
  text-decoration: none;
  box-shadow: inset 3px 3px 3px rgba(255, 255, 255, 0.2),
    inset -3px -3px 3px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

.mainLayout-main {
  flex: 1;
}

@media (max-width: 827px) {
  .mainLayout-header {
    align-items: center;
    flex-wrap: wrap;
  }
  .mainLayout-nav {
    width: 100%;
    flex-direction: column;
    display: none;
    align-items: stretch;
  }
  [aria-expanded='true'] + .mainLayout-nav {
    display: flex;
  }
  .mainLayout-navToggle {
    display: block;
  }
}

.mainLayout-footer {
}
.mainLayout-footer a {
  color: black;
  font-weight: 600;
}
</style>
