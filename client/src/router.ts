import { createRouter, createWebHashHistory } from 'vue-router'

import { Routes } from './utils'
import HomeView from './home/HomeView.vue'

const routes = [
  { ...Routes.home, path: '/', component: HomeView },
  { ...Routes.register, path: '/register', component: HomeView },
  { ...Routes.login, path: '/login', component: HomeView },
  { ...Routes.entries, path: '/entries', component: HomeView },
  { ...Routes.newEntry, path: '/new-entry', component: HomeView },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
