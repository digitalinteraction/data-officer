import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { defineLayoutElements } from '@openlab/alembic'

import App from './App.vue'
import { router } from './router'

defineLayoutElements()

createApp(App).use(router).use(createPinia()).mount('#app')
