import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import { Routes, emitMetric } from './utils'

import HomeView from './home/home-view.vue'

import LoginView from './auth/login-view.vue'
import RegisterView from './auth/register-view.vue'
import VerifySmsView from './auth/verify-sms-view.vue'
import NewEntry from './entries/new-entry-view.vue'
import EntriesView from './entries/entries-view.vue'
import EntryView from './entries/entry-view.vue'

import NewComponentCollect from './entries/new-entry-collect.vue'
import NewEntryInit from './entries/new-entry-init.vue'
import NewEntryDetails from './entries/new-entry-details.vue'
import NewEntryCompare from './entries/new-entry-compare.vue'
import NewEntryReview from './entries/new-entry-review.vue'
import ProfileView from './auth/profile-view.vue'

const routes: RouteRecordRaw[] = [
  { ...Routes.home, path: '/', component: HomeView },
  { ...Routes.register, path: '/register', component: RegisterView },
  { ...Routes.login, path: '/login', component: LoginView },
  { ...Routes.entries, path: '/entries', component: EntriesView },
  { ...Routes.verifySms, path: '/verify-sms', component: VerifySmsView },
  { ...Routes.profile, path: '/profile', component: ProfileView },

  {
    ...Routes.entry,
    path: '/entry/:entryId',
    component: EntryView,
    props: true,
  },

  {
    path: '/new-entry',
    component: NewEntry,
    children: [
      {
        ...Routes.newEntry,
        path: '',
        component: NewEntryInit,
      },
      {
        ...Routes.newEntryCollect,
        path: 'collect',
        component: NewComponentCollect,
      },
      {
        ...Routes.newEntryDetails,
        path: 'details',
        component: NewEntryDetails,
      },
      {
        ...Routes.newEntryCompare,
        path: 'compare',
        component: NewEntryCompare,
      },
      {
        ...Routes.newEntryReview,
        path: 'review',
        component: NewEntryReview,
      },
    ],
  },
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
