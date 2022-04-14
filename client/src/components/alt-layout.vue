<script lang="ts" setup>
import MainBrand from './main-brand.vue'
import MainFooter from './main-footer.vue'
</script>

<template>
  <div class="altLayout">
    <header class="altLayout-header">
      <MainBrand />
    </header>
    <main class="altLayout-main">
      <slot></slot>
    </main>
    <MainFooter />
  </div>
</template>

<style>
.altLayout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.altLayout-header {
  padding: var(--s-2) var(--s-1);
  border-bottom: 2px solid #ccd9cc;
}
.altLayout-main {
  flex: 1;
  background-color: #f3f3f3;
  padding-block: var(--s1);
}
</style>
