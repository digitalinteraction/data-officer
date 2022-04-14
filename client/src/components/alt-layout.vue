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
      <center-layout>
        <box-layout borderWidth="0" padding="var(--s0)">
          <stack-layout space="var(--s0)">
            <slot></slot>
          </stack-layout>
        </box-layout>
      </center-layout>
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
  border-bottom: 2px solid var(--borderColor);
}
.altLayout-main {
  flex: 1;
  background-color: #f3f3f3;
  padding-block: var(--s1);
}
</style>
