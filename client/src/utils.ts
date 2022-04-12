import { defineComponent, h } from 'vue'

export function getIconHref(name: string) {
  return `/icons.svg#${name}`
}

export const SvgIcon = defineComponent({
  name: 'SvgIcon',
  props: { name: { type: String, required: true } },
  render() {
    return h('svg', null, h('use', { href: getIconHref(this.name) }))
  },
})

export const Routes = {
  home: { name: 'home' },
  register: { name: 'register' },
  login: { name: 'login' },
  entries: { name: 'entries' },
  newEntry: { name: 'newEntry' },
}
