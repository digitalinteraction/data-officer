import { defineStore } from 'pinia'

interface User {}

interface AuthState {
  user: User | null
}

export const useAuthStore = defineStore('auth', {
  state: () =>
    ({
      user: null,
    } as AuthState),
  getters: {
    isLoggedIn: (state): Boolean => Boolean(state.user),
  },
})
