import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // 👇 1. Fix lỗi "global is not defined" của sockjs-client
  define: {
    global: 'window',
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // 👇 2. Cấu hình Proxy cho WebSocket (Quan trọng)
      '/ws-chat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // Bắt buộc phải có để proxy hỗ trợ giao thức ws://
        secure: false,
      },
    },
  },
})