import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',	// 新增
  plugins: [vue()],
  server: {
    port: 3304,
  }
})