<script setup lang="ts"></script>

<template>
  <router-view></router-view>
</template>

<style>
@import '@openlab/alembic/reset.css';
@import '@openlab/alembic/layouts.css';
@import './assets/inter/inter.css';

:root {
  /* @openlab/alembic axioms */
  --foregroundColor: black;
  --backgroundColor: white;
  --border-thin: 0.125rem;
  --measure: 60ch;
}

html {
  background-color: white;
  font-family: 'Inter var', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
    'Segoe UI Emoji';
  font-size: calc(0.333vw + 1em);
}

h1 {
  font-size: var(--s3);
}
h2 {
  font-size: var(--s2);
}
h3 {
  font-size: var(--s1);
}

button,
.button {
  padding: 0.3em 0.5em;
  border: 1px solid black;
  background: #dfeaec;
  color: black;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
}
</style>
