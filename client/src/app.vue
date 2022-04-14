<template>
  <router-view></router-view>
</template>

<style>
@import '@openlab/alembic/reset.css';
@import '@openlab/alembic/layouts.css';
@import './assets/inter/inter.css';
@import './assets/forms.css';

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
  --borderColor: #708090;
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
a {
  color: #2076ff;
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
</style>
