import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'

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

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

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
  define: {
    __APP_VERSION__: `"${pkg.version}"`,
  },
})
