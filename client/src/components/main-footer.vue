<script lang="ts" setup>
const appVersion = __APP_VERSION__
</script>

<template>
  <footer class="mainFooter">
    <p>
      Made by
      <a href="https://openlab.ncl.ac.uk" target="_blank" rel="noopener"
        >Open Lab</a
      >
      / DataDiaries v{{ appVersion }}
    </p>
  </footer>
</template>

<style>
.mainFooter {
  text-align: center;
  padding: var(--s2) var(--s-1) var(--s0);
  background: #f3f3f3;
  font-size: 16px;
  color: var(--color-darkish);
}
.mainFooter a {
  color: black;
  font-weight: 600;
}
</style>
