import { createRouter, createWebHistory } from 'vue-router'

import { Routes, emitMetric } from './utils'

import HomeView from './home/home-view.vue'
import LoginView from './auth/login-view.vue'
import RegisterView from './auth/register-view.vue'
import VerifySmsView from './auth/verify-sms-view.vue'

const routes = [
  { ...Routes.home, path: '/', component: HomeView },
  { ...Routes.register, path: '/register', component: RegisterView },
  { ...Routes.login, path: '/login', component: LoginView },
  { ...Routes.entries, path: '/entries', component: HomeView },
  { ...Routes.newEntry, path: '/new-entry', component: HomeView },
  { ...Routes.verifySms, path: '/verify-sms', component: VerifySmsView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  emitMetric('pageView', {
    name: to.name,
    path: to.path,
    params: to.params,
  })
  next()
})
