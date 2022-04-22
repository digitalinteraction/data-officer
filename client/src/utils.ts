import { defineComponent, h } from 'vue'
import io from 'socket.io-client'

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
  verifySms: { name: 'verifySms' },
}

export interface AppConfig {
  SELF_URL: string
  SERVER_URL: string
  JWT_ISSUER: string
  ENABLE_METRICS: boolean
}

type WindowWithConfig = typeof window & {
  CONFIG?: Partial<AppConfig>
}

const {
  SELF_URL = 'http://localhost:8080',
  SERVER_URL = 'http://localhost:3000',
  JWT_ISSUER = 'data-diaries-01',
  ENABLE_METRICS = false,
} = (window as WindowWithConfig).CONFIG ?? {}

export const config: AppConfig = {
  SELF_URL,
  SERVER_URL,
  JWT_ISSUER,
  ENABLE_METRICS,
}

export type FormState = 'pending' | 'success' | 'loading' | 'error'

function createSocket(serverUrl: string) {
  const pathname = new URL(serverUrl).pathname.replace(/\/?$/, '/socket.io')
  const socketUrl = new URL(serverUrl)
  socketUrl.protocol = socketUrl.protocol.replace(/^http/, 'ws')
  socketUrl.pathname = '/'
  return io(socketUrl.toString(), {
    path: pathname,
    transports: ['websocket'],
  })
}

export const socket = createSocket(config.SERVER_URL)
socket.connect()

export function emitMetric(metric: string, payload: unknown) {
  if (!config.ENABLE_METRICS) return
  socket.emit('metric', metric, payload)
}
