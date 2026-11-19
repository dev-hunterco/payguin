import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: '/__admin/',
  server: {
    port: 5173,
    proxy: {
      '/__admin/api': 'http://localhost:8787',
      '/__sim': 'http://localhost:8787',
      '/v2': 'http://localhost:8787',
      '/v3': 'http://localhost:8787',
    },
  },
  build: {
    outDir: 'dist',
  },
})
