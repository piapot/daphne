import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '~lib': resolve(__dirname, 'lib'),
    },
  },
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'Daphne',
      fileName: 'index',
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  test: {
    includeSource: ['{src,lib}/**/*.{js,ts,jsx,tsx}'],
  },
  plugins: [dts()],
})
