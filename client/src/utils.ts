import { defineComponent, h } from 'vue'

export const SvgIcon = defineComponent({
  name: 'SvgIcon',
  props: { name: { type: String, required: true } },
  render() {
    return h('svg', null, h('use', { href: `/icons.svg#${this.name}` }))
  },
})

export const Routes = {
  home: { name: 'home' },
  register: { name: 'register' },
  login: { name: 'login' },
  entries: { name: 'entries' },
  newEntry: { name: 'newEntry' },
}

export interface AppConfig {
  SELF_URL: string
  SERVER_URL: string
  JWT_ISSUER: string
}

type WindowWithConfig = typeof window & {
  CONFIG?: Partial<AppConfig>
}

const {
  SELF_URL = 'http://localhost:8080',
  SERVER_URL = 'http://localhost:3000',
  JWT_ISSUER = 'data-diaries-01',
} = (window as WindowWithConfig).CONFIG ?? {}

export const config: AppConfig = { SELF_URL, SERVER_URL, JWT_ISSUER }
