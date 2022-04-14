import { createRouter, createWebHistory } from 'vue-router'

import { Routes } from './utils'
import HomeView from './home/home-view.vue'
import LoginView from './auth/login-view.vue'

const routes = [
  { ...Routes.home, path: '/', component: HomeView },
  { ...Routes.register, path: '/register', component: HomeView },
  { ...Routes.login, path: '/login', component: LoginView },
  { ...Routes.entries, path: '/entries', component: HomeView },
  { ...Routes.newEntry, path: '/new-entry', component: HomeView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
