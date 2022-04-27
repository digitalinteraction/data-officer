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
    authToken: null,
  }),
  getters: {
    isLoggedIn: (state): Boolean => Boolean(state.authToken),
    user: (state): AppToken | null => {
      return state.authToken ? (decodeJwt(state.authToken) as AppToken) : null
    },
    requestHeaders: (state): HeadersInit => {
      const h: HeadersInit = {}
      if (state.authToken) h.authorization = `bearer ${state.authToken}`
      return h
    },
  },
  actions: {
    /** Initially look for the localStorage auth token, or clear it if invalid */
    setup() {
      const token = localStorage.getItem('authToken')
      if (token) {
        this.authenticate(token)
        if (!this.authToken) localStorage.removeItem('authToken')
      }
    },
    /** Authenticate the store if an auth token is valid */
    authenticate(token: string) {
      const payload = decodeJwt(token) as AppToken
      if (payload.iss !== config.JWT_ISSUER) return
      this.authToken = token
      localStorage.setItem('authToken', token)
    },
    unauthenticate() {
      this.authToken = null
      localStorage.removeItem('authToken')
    },
  },
})
