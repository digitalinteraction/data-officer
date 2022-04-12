import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const layoutNames = [
  'stack-layout',
  'box-layout',
  'center-layout',
  'cluster-layout',
  'sidebar-layout',
  'switcher-layout',
  'cover-layout',
  'grid-layout',
  'frame-layout',
  'reel-layout',
  'imposter-layout',
  'icon-layout',
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => layoutNames.indexOf(tag) !== -1,
        },
      },
    }),
  ],
})
