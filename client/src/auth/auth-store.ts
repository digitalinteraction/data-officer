import { defineStore } from 'pinia'
import { config } from '../utils'

function decodeJwt(token: string): unknown {
  return JSON.parse(window.atob(token.split('.')[1]))
}

export interface AppToken {
  sub: number
  iss: string
  app: {
    roles: string[]
  }
}

interface AuthState {
  authToken: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    authToken: localStorage.getItem('authToken'),
  }),
  getters: {
    isLoggedIn: (state): Boolean => Boolean(state.authToken),
    user: (state): AppToken | null => {
      return state.authToken ? (decodeJwt(state.authToken) as AppToken) : null
    },
  },
  actions: {
    authenticate(token: string) {
      const payload = decodeJwt(token) as AppToken
      if (payload.iss !== config.JWT_ISSUER) return
      this.authToken = token
      localStorage.setItem('authToken', token)
    },
  },
})
