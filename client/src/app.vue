<template>
  <router-view></router-view>
</template>

<style>
@import '@openlab/alembic/reset.css';
@import '@openlab/alembic/layouts.css';
@import './assets/inter/inter.css';

:root {
  /* @openlab/alembic axioms */
  --foregroundColor: #2a2e35;
  --backgroundColor: white;
  --border-thin: 0.125rem;
  --measure: 60ch;

  --primary: #238fef;
  --primary-alt: white;
  --secondary: #21accd;
  --secondary-alt: white;
}

html {
  background-color: white;
  font-family: 'Inter var', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
    'Segoe UI Emoji';
  font-size: calc(0.333vw + 1em);
}

h1 {
  font-size: var(--s2);
}
h2 {
  font-size: var(--s1);
}
h3 {
  font-size: var(--s0);
}

.primaryButton,
.secondaryButton {
  padding: 0.4em 0.8em;
  border: none;
  margin: 0;
  font-weight: 500;
  text-decoration: none;
  box-shadow: inset 3px 3px 3px rgba(255, 255, 255, 0.2),
    inset -3px -3px 3px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}
.primaryButton {
  background-color: var(--primary);
  color: var(--primary-alt);
}
.primaryButton:hover {
  filter: brightness(1.2);
}
.secondaryButton {
  background-color: var(--secondary);
  color: var(--secondary-alt);
}
.secondaryButton:hover {
  filter: brightness(1.1);
}

/* .accent\:primary {
  --backgroundColor: var(--primary);
  --foregroundColor: var(--primary-alt);
}
.accent\:secondary {
  --backgroundColor: var(--secondary);
  --foregroundColor: var(--secondary-alt);
} */

.field {
  max-width: 22em;
}
.field:not(:last-child) {
  margin-bottom: var(--s0);
}
.field label {
  margin-bottom: var(--s-4);
  display: block;
  line-height: 1.25;
}
.field-label {
  font-weight: 600;
  display: block;
}
.field-hint {
  font-weight: 400;
  display: block;
  margin-bottom: var(--s-4);
  color: #708090;
  font-size: 0.9em;
}
.field input {
  border: 2px solid #708090;
  margin: 0;
  border-radius: 2px;
  padding: 0.25em;
  width: 100%;
}
</style>
