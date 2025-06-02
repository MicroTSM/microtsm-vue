import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      external: ['@fewangsit/wangsvue-fats', '@fewangsit/wangsvue-fats'],
    },
  },
  server: {
    port: 4175,
  },
  preview: {
    port: 4175,
  },
})
