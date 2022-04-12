<script lang="ts" setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { SvgIcon, Routes } from '../utils'

const auth = useAuthStore()

function toggleMenu() {
  showMobileMenu.value = !showMobileMenu.value
}

const showMobileMenu = ref(false)
</script>

<template>
  <div class="mainLayout">
    <!-- HEADER -->
    <header class="mainLayout-header">
      <router-link :to="Routes.home" class="mainLayout-brand"
        >DataDiaries</router-link
      >
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
          <router-link :to="Routes.newEntry" class="mainLayout-navButton">
            New Entry
          </router-link>
        </template>

        <template v-else>
          <router-link :to="Routes.register" class="mainLayout-navButton">
            Register
          </router-link>
        </template>
      </nav>
    </header>

    <!-- MAIN -->
    <div class="mainLayout-main">
      <slot></slot>
    </div>

    <!-- FOOTER -->
    <footer class="mainLayout-footer">
      <p>
        Made by
        <a href="https://openlab.ncl.ac.uk" target="_blank" rel="noopener"
          >Open Lab</a
        >
      </p>
    </footer>
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
  border-bottom: 2px solid #ccd9cc;

  display: flex;
  justify-content: space-between;
  gap: var(--s0);
}
.mainLayout-nav {
  display: flex;
  gap: var(--s0);
}
.mainLayout-navToggle {
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
  color: black;
  font-weight: bold;
}
.mainLayout-brand {
  color: black;
  text-decoration: underline;
  font-style: italic;
  font-size: 22px;
  font-weight: 800;
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
  }
  [aria-expanded='true'] + .mainLayout-nav {
    display: flex;
  }
  .mainLayout-navToggle {
    display: block;
  }
}

.mainLayout-footer {
  text-align: center;
  padding: var(--s3) var(--s0) var(--s1);
  background: #f3f3f3;
}
.mainLayout-footer a {
  color: black;
  font-weight: 600;
}
</style>
